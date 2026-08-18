import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { PaymentMethod, SettlementMatchStatus } from '../common/enums';
import { CashDeposit } from './cash-deposit.entity';
import { CustomerPayment } from '../customers/customer-payment.entity';
import { SalePayment } from '../sales/sale-payment.entity';
import { BankAccount } from './bank-account.entity';
import { BankStatementLine } from './bank-statement-line.entity';
import { MobileMoneyLine } from './mobile-money-line.entity';

@Injectable()
export class BankingService implements OnModuleInit {
  constructor(
    @InjectRepository(MobileMoneyLine)
    private readonly linesRepo: Repository<MobileMoneyLine>,
    @InjectRepository(SalePayment)
    private readonly paymentsRepo: Repository<SalePayment>,
    @InjectRepository(BankAccount)
    private readonly bankAccountsRepo: Repository<BankAccount>,
    @InjectRepository(BankStatementLine)
    private readonly bankLinesRepo: Repository<BankStatementLine>,
    @InjectRepository(CashDeposit)
    private readonly depositsRepo: Repository<CashDeposit>,
    @InjectRepository(CustomerPayment)
    private readonly customerPaymentsRepo: Repository<CustomerPayment>,
  ) {}

  async onModuleInit() {
    const count = await this.bankAccountsRepo.count();
    if (count > 0) return;
    await this.bankAccountsRepo.save([
      this.bankAccountsRepo.create({
        accountName: 'Operating Current Account',
        bankName: 'NBM',
        accountMask: '****4521',
        glAccountCode: '1120',
        isActive: true,
      }),
      this.bankAccountsRepo.create({
        accountName: 'Mobile Money Clearing',
        bankName: 'Airtel/TNM',
        accountMask: 'MM-CLEAR',
        glAccountCode: '1105',
        isActive: true,
      }),
    ]);
  }

  listBankAccounts() {
    return this.bankAccountsRepo.find({
      where: { isActive: true },
      order: { accountName: 'ASC' },
    });
  }

  async importCsv(params: { stationId?: string; csvText: string }) {
    const rows = params.csvText
      .trim()
      .split('\n')
      .slice(1)
      .map((line) => line.split(',').map((c) => c.trim()));

    const imported: MobileMoneyLine[] = [];
    for (const cols of rows) {
      const [date, reference, amountStr, provider, feeStr, batch] = cols;
      if (!reference || !amountStr) continue;
      const gross = round2(Number(amountStr));
      const fee = feeStr ? round2(Number(feeStr)) : 0;
      const net = round2(gross - fee);
      const line = await this.linesRepo.save(
        this.linesRepo.create({
          stationId: params.stationId,
          provider: provider || 'AIRTEL_MONEY',
          txnDate: date,
          reference,
          amount: asDecimal(gross, 2),
          feeAmount: asDecimal(fee, 2),
          netAmount: asDecimal(net, 2),
          settlementBatch: batch || undefined,
          paymentMethod:
            provider?.includes('TNM') || provider?.includes('MPAMBA')
              ? PaymentMethod.TNM_MPAMBA
              : PaymentMethod.AIRTEL_MONEY,
          status: SettlementMatchStatus.UNMATCHED,
        }),
      );
      imported.push(line);
    }

    await this.autoMatch(imported);
    return { imported: imported.length, lines: imported };
  }

  private async autoMatch(lines: MobileMoneyLine[]) {
    for (const line of lines) {
      const payment = await this.paymentsRepo.findOne({
        where: { reference: line.reference },
      });
      const matchAmount = line.netAmount ?? line.amount;
      if (
        payment &&
        Math.abs(toNumber(payment.amount) - toNumber(matchAmount)) < 0.05
      ) {
        line.status = SettlementMatchStatus.MATCHED;
        line.matchedPaymentId = payment.id;
        await this.linesRepo.save(line);
      }
    }
  }

  async importBankCsv(params: { bankAccountId: string; csvText: string }) {
    const account = await this.bankAccountsRepo.findOne({
      where: { id: params.bankAccountId },
    });
    if (!account) throw new Error('Bank account not found');

    const rows = params.csvText
      .trim()
      .split('\n')
      .slice(1)
      .map((line) => line.split(',').map((c) => c.trim()));

    const imported: BankStatementLine[] = [];
    for (const [date, reference, description, amountStr] of rows) {
      if (!reference || !amountStr) continue;
      const line = await this.bankLinesRepo.save(
        this.bankLinesRepo.create({
          bankAccountId: params.bankAccountId,
          txnDate: date,
          reference,
          description,
          amount: asDecimal(round2(Number(amountStr)), 2),
          status: SettlementMatchStatus.UNMATCHED,
        }),
      );
      imported.push(line);
    }

    await this.autoMatchBank(imported);
    return { imported: imported.length, lines: imported };
  }

  private async autoMatchBank(lines: BankStatementLine[]) {
    for (const line of lines) {
      const amount = toNumber(line.amount);
      if (amount <= 0) continue;

      const deposit = await this.depositsRepo.findOne({
        where: { slipNumber: line.reference },
      });
      if (deposit && Math.abs(toNumber(deposit.amount) - amount) < 1) {
        line.status = SettlementMatchStatus.MATCHED;
        line.matchedEntityType = 'CASH_DEPOSIT';
        line.matchedEntityId = deposit.id;
        await this.bankLinesRepo.save(line);
        continue;
      }

      const cp = await this.customerPaymentsRepo.findOne({
        where: { reference: line.reference },
      });
      if (cp && Math.abs(toNumber(cp.amount) - amount) < 1) {
        line.status = SettlementMatchStatus.MATCHED;
        line.matchedEntityType = 'CUSTOMER_PAYMENT';
        line.matchedEntityId = cp.id;
        await this.bankLinesRepo.save(line);
      }
    }
  }

  reconciliation(stationId?: string) {
    return this.linesRepo.find({
      where: stationId ? { stationId } : {},
      relations: { matchedPayment: true, station: true },
      order: { txnDate: 'DESC' },
      take: 200,
    });
  }

  bankReconciliation(bankAccountId?: string) {
    return this.bankLinesRepo.find({
      where: bankAccountId ? { bankAccountId } : {},
      relations: { bankAccount: true },
      order: { txnDate: 'DESC' },
      take: 200,
    });
  }

  summary(stationId?: string) {
    return this.linesRepo
      .find({ where: stationId ? { stationId } : {} })
      .then((lines) => ({
        total: lines.length,
        matched: lines.filter((l) => l.status === SettlementMatchStatus.MATCHED)
          .length,
        unmatched: lines.filter(
          (l) => l.status === SettlementMatchStatus.UNMATCHED,
        ).length,
        totalAmount: round2(lines.reduce((s, l) => s + toNumber(l.amount), 0)),
        totalFees: round2(
          lines.reduce((s, l) => s + toNumber(l.feeAmount ?? 0), 0),
        ),
        totalNet: round2(
          lines.reduce((s, l) => s + toNumber(l.netAmount ?? l.amount), 0),
        ),
      }));
  }

  bankSummary(bankAccountId?: string) {
    return this.bankLinesRepo
      .find({ where: bankAccountId ? { bankAccountId } : {} })
      .then((lines) => ({
        total: lines.length,
        matched: lines.filter((l) => l.status === SettlementMatchStatus.MATCHED)
          .length,
        unmatched: lines.filter(
          (l) => l.status === SettlementMatchStatus.UNMATCHED,
        ).length,
        totalAmount: round2(lines.reduce((s, l) => s + toNumber(l.amount), 0)),
      }));
  }
}
