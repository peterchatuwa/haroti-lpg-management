import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import {
  CommissionStatus,
  JournalEventType,
  SaleStatus,
  SalesChannel,
  SettlementStatus,
  StockOwnership,
} from '../common/enums';
import { AccessoriesService } from '../accessories/accessories.service';
import { Customer } from '../customers/customer.entity';
import { FinanceService, GL_ACCOUNTS } from '../finance/finance.service';
import { Sale } from '../sales/sale.entity';
import { AgentCommission } from './agent-commission.entity';
import { FranchiseAgreement } from './franchise-agreement.entity';
import { FranchiseSettlementLine } from './franchise-settlement-line.entity';
import { FranchiseSettlement } from './franchise-settlement.entity';

@Injectable()
export class FranchiseService {
  constructor(
    @InjectRepository(FranchiseAgreement)
    private readonly agreementsRepo: Repository<FranchiseAgreement>,
    @InjectRepository(FranchiseSettlement)
    private readonly settlementsRepo: Repository<FranchiseSettlement>,
    @InjectRepository(FranchiseSettlementLine)
    private readonly linesRepo: Repository<FranchiseSettlementLine>,
    @InjectRepository(AgentCommission)
    private readonly commissionsRepo: Repository<AgentCommission>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    private readonly financeService: FinanceService,
    private readonly accessoriesService: AccessoriesService,
  ) {}

  listAgreements() {
    return this.agreementsRepo.find({
      where: { isActive: true },
      relations: { station: true },
    });
  }

  listSettlements() {
    return this.settlementsRepo.find({
      relations: { agreement: { station: true }, lines: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async generateSettlement(agreementId: string, periodStart: string, periodEnd: string) {
    const agreement = await this.agreementsRepo.findOne({
      where: { id: agreementId },
      relations: { station: true },
    });
    if (!agreement) throw new NotFoundException('Franchise agreement not found');

    const sales = await this.salesRepo.find({
      where: {
        stationId: agreement.stationId,
        soldAt: Between(new Date(periodStart), new Date(periodEnd)),
        status: SaleStatus.COMPLETED,
      },
    });

    const totalSales = round2(
      sales.reduce((s, x) => s + toNumber(x.totalAmount), 0),
    );
    const royaltyDue = round2(
      totalSales * (toNumber(agreement.royaltyPercent) / 100),
    );

    const consignmentStock = await this.accessoriesService.listStock(
      agreement.stationId,
    );
    const consignmentValue = round2(
      consignmentStock
        .filter((s) => s.ownership === StockOwnership.CONSIGNMENT)
        .reduce(
          (sum, s) =>
            sum + s.quantity * toNumber(s.product?.unitPrice ?? 0),
          0,
        ),
    );

    const settlement = await this.settlementsRepo.save(
      this.settlementsRepo.create({
        settlementNumber: `FS-${Date.now().toString().slice(-8)}`,
        agreementId,
        periodStart,
        periodEnd,
        status: SettlementStatus.PENDING_INVOICE,
        totalSales: asDecimal(totalSales, 2),
        royaltyDue: asDecimal(royaltyDue, 2),
        consignmentDue: asDecimal(consignmentValue, 2),
        lines: [
          this.linesRepo.create({
            description: `LPG & accessory sales (${sales.length} txns)`,
            quantity: sales.length,
            unitAmount: asDecimal(totalSales / Math.max(sales.length, 1), 2),
            lineTotal: asDecimal(totalSales, 2),
          }),
          this.linesRepo.create({
            description: `Royalty @ ${agreement.royaltyPercent}%`,
            quantity: 1,
            unitAmount: asDecimal(royaltyDue, 2),
            lineTotal: asDecimal(royaltyDue, 2),
          }),
        ],
      }),
    );

    return settlement;
  }

  async invoiceSettlement(id: string) {
    const settlement = await this.settlementsRepo.findOne({
      where: { id },
      relations: { agreement: true },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');

    settlement.status = SettlementStatus.INVOICED;
    await this.settlementsRepo.save(settlement);

    const invoiceAmount = round2(toNumber(settlement.royaltyDue));
    if (invoiceAmount > 0) {
      await this.financeService.postEntry({
        eventType: JournalEventType.FRANCHISE_SETTLEMENT,
        description: `Franchise settlement ${settlement.settlementNumber}`,
        referenceType: 'FranchiseSettlement',
        referenceId: settlement.id,
        lines: [
          { account: GL_ACCOUNTS.AR_FRANCHISE, debit: invoiceAmount },
          { account: GL_ACCOUNTS.REVENUE_LPG, credit: invoiceAmount },
        ],
      });
    }

    return settlement;
  }

  async accrueAgentCommission(saleId: string, agentId: string, saleAmount: number, percent: number) {
    const commission = round2(saleAmount * (percent / 100));
    return this.commissionsRepo.save(
      this.commissionsRepo.create({
        agentId,
        saleId,
        saleAmount: asDecimal(saleAmount, 2),
        commissionPercent: asDecimal(percent, 2),
        commissionAmount: asDecimal(commission, 2),
        status: CommissionStatus.ACCRUED,
      }),
    );
  }

  listAgentCommissions(agentId?: string) {
    return this.commissionsRepo.find({
      where: agentId ? { agentId } : {},
      relations: { agent: true, sale: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async agentDashboard(agentId: string) {
    const agent = await this.customersRepo.findOne({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    const commissions = await this.listAgentCommissions(agentId);
    const consignment = agent.stationId
      ? await this.accessoriesService.listStock(agent.stationId)
      : [];

    return {
      agent,
      totalCommissionAccrued: round2(
        commissions.reduce((s, c) => s + toNumber(c.commissionAmount), 0),
      ),
      pendingCommission: round2(
        commissions
          .filter((c) => c.status === CommissionStatus.ACCRUED)
          .reduce((s, c) => s + toNumber(c.commissionAmount), 0),
      ),
      consignmentItems: consignment.filter(
        (s) => s.ownership === StockOwnership.CONSIGNMENT,
      ),
      recentCommissions: commissions.slice(0, 10),
    };
  }

  async recordAgentSale(params: {
    agentId: string;
    stationId: string;
    productId: string;
    quantity: number;
    paymentMethod: string;
    clientTxnId?: string;
  }) {
    const agent = await this.customersRepo.findOne({ where: { id: params.agentId } });
    if (!agent) throw new BadRequestException('Invalid agent');

    await this.accessoriesService.deductForSale(params.stationId, [
      { productId: params.productId, quantity: params.quantity },
    ]);

    const price = await this.accessoriesService.getPrice(
      params.productId,
      SalesChannel.AGENT_COMMISSION,
    );
    const total = round2(price * params.quantity);

    const commission = await this.accrueAgentCommission(
      '',
      params.agentId,
      total,
      8,
    );

    return { total, commission, clientTxnId: params.clientTxnId };
  }
}
