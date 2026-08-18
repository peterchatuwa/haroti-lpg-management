import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AccessoriesService } from '../accessories/accessories.service';
import { CylindersService } from '../cylinders/cylinders.service';
import { CustomersService } from '../customers/customers.service';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import {
  CommercialStream,
  PaymentMethod,
  SaleStatus,
  SalesChannel,
  StockMovementType,
  UserRole,
} from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { FranchiseService } from '../franchise/franchise.service';
import { InventoryService } from '../inventory/inventory.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaychanguService } from '../paychangu/paychangu.service';
import { PriceList } from '../pricing/price-list.entity';
import { ShiftsService } from '../shifts/shifts.service';
import { StationsService } from '../stations/stations.service';
import { User } from '../users/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';
import { Sale } from './sale.entity';

const DISCOUNT_APPROVER_ROLES = new Set<UserRole>([
  UserRole.STATION_MANAGER,
  UserRole.OPERATIONS_MANAGER,
  UserRole.FINANCE_MANAGER,
  UserRole.DIRECTOR,
  UserRole.SYSTEM_ADMIN,
]);

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(PriceList)
    private readonly pricesRepo: Repository<PriceList>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly inventoryService: InventoryService,
    private readonly stationsService: StationsService,
    private readonly auditService: AuditService,
    private readonly accessoriesService: AccessoriesService,
    private readonly financeService: FinanceService,
    private readonly customersService: CustomersService,
    private readonly franchiseService: FranchiseService,
    private readonly shiftsService: ShiftsService,
    private readonly notificationsService: NotificationsService,
    private readonly cylindersService: CylindersService,
    private readonly loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => PaychanguService))
    private readonly paychanguService: PaychanguService,
  ) {}

  async getActivePrice(stationId: string) {
    const now = new Date();
    const stationPrice = await this.pricesRepo.findOne({
      where: { stationId, isActive: true },
      order: { effectiveFrom: 'DESC' },
    });
    if (
      stationPrice &&
      stationPrice.effectiveFrom <= now &&
      (!stationPrice.effectiveTo || stationPrice.effectiveTo >= now)
    ) {
      return toNumber(stationPrice.pricePerKg);
    }

    const national = await this.pricesRepo.findOne({
      where: { stationId: IsNull(), isActive: true },
      order: { effectiveFrom: 'DESC' },
    });

    return toNumber(national?.pricePerKg ?? 1850);
  }

  private receiptNumber(stationCode: string) {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const rand = Math.floor(Math.random() * 900 + 100);
    return `R-${stationCode}-${stamp}-${rand}`;
  }

  async createSale(dto: CreateSaleDto, attendantId: string) {
    if (dto.clientTxnId) {
      const existing = await this.salesRepo.findOne({
        where: { clientTxnId: dto.clientTxnId },
        relations: { items: true, payments: true },
      });
      if (existing) {
        if (this.offlinePayloadConflict(existing, dto)) {
          throw new ConflictException(
            'Offline sale conflict: clientTxnId already used with different payload',
          );
        }
        return existing;
      }
    }

    if (!dto.items?.length && !dto.bundleId) {
      throw new BadRequestException('Sale must include at least one item');
    }

    const station = await this.stationsService.findOne(dto.stationId);
    await this.shiftsService.requireOpenShiftForSale(
      dto.shiftId,
      dto.stationId,
      attendantId,
    );
    const activePrice = await this.getActivePrice(dto.stationId);
    const salesChannel = dto.salesChannel ?? SalesChannel.RETAIL_LIST;
    const commercialStream =
      station.commercialStream ?? CommercialStream.RETAIL_FORECOURT;

    let saleItems = dto.items ?? [];

    for (const item of saleItems) {
      if (item.cylinderSerial) {
        await this.cylindersService.assertSerialEligible(item.cylinderSerial);
      }
    }

    if (dto.bundleId) {
      const components = await this.accessoriesService.explodeBundle(dto.bundleId);
      const bundles = await this.accessoriesService.listBundles();
      const bundle = bundles.find((b) => b.id === dto.bundleId);
      saleItems = [
        {
          itemName: bundle?.name ?? 'Starter Kit',
          unitPrice: toNumber(bundle?.bundlePrice ?? 0),
          quantity: 1,
        },
      ];
      await this.accessoriesService.deductForSale(
        dto.stationId,
        components.map((c) => ({ productId: c.productId, quantity: c.quantity })),
      );
    }

    const items: Partial<SaleItem>[] = [];
    for (const item of saleItems) {
      let lpgQty = item.lpgQuantityKg ?? 0;
      if (
        item.emptyWeightKg !== undefined &&
        item.filledWeightKg !== undefined
      ) {
        lpgQty = round3(item.filledWeightKg - item.emptyWeightKg);
        if (lpgQty <= 0) {
          throw new BadRequestException(
            'Filled weight must be greater than empty weight',
          );
        }
      }

      let unitPrice = item.unitPrice;
      if (lpgQty > 0 && !item.productId) {
        unitPrice = activePrice;
      } else if (item.productId && item.unitPrice === 0) {
        unitPrice = await this.accessoriesService.getPrice(
          item.productId,
          salesChannel,
        );
      }

      const lineTotal =
        lpgQty > 0
          ? round2(lpgQty * unitPrice)
          : round2(unitPrice * item.quantity);

      items.push({
        productId: item.productId,
        itemName: item.itemName,
        cylinderSizeKg:
          item.cylinderSizeKg !== undefined
            ? asDecimal(item.cylinderSizeKg)
            : undefined,
        cylinderSerial: item.cylinderSerial,
        emptyWeightKg:
          item.emptyWeightKg !== undefined
            ? asDecimal(item.emptyWeightKg)
            : undefined,
        filledWeightKg:
          item.filledWeightKg !== undefined
            ? asDecimal(item.filledWeightKg)
            : undefined,
        lpgQuantityKg: asDecimal(lpgQty),
        unitPrice: asDecimal(unitPrice, 2),
        lineTotal: asDecimal(lineTotal, 2),
        quantity: item.quantity,
      });
    }

    const subtotal = round2(
      items.reduce((sum, i) => sum + toNumber(i.lineTotal), 0),
    );
    const discount = round2(dto.discountAmount ?? 0);
    if (discount > subtotal) {
      throw new BadRequestException('Discount cannot exceed subtotal');
    }
    const total = round2(subtotal - discount);
    const lpgQuantityKg = round3(
      items.reduce((sum, i) => sum + toNumber(i.lpgQuantityKg), 0),
    );

    const paymentTotal = round2(
      dto.payments.reduce((sum, p) => sum + p.amount, 0),
    );
    if (Math.abs(paymentTotal - total) > 0.05) {
      throw new BadRequestException(
        `Payments (${paymentTotal}) must equal sale total (${total})`,
      );
    }

    const hasCredit = dto.payments.some(
      (p) => p.method === PaymentMethod.CUSTOMER_ACCOUNT,
    );
    if (hasCredit) {
      if (!dto.customerId) {
        throw new BadRequestException('Customer required for credit sales');
      }
      await this.customersService.checkCredit(dto.customerId, total);
    }

    const hasPaychangu = dto.payments.some(
      (p) => p.method === PaymentMethod.PAYCHANGU,
    );
    if (hasPaychangu) {
      if (dto.payments.length > 1) {
        throw new BadRequestException(
          'PayChangu cannot be combined with other payment methods',
        );
      }
      if (!dto.customerPhone?.trim()) {
        throw new BadRequestException(
          'Customer phone is required for PayChangu payments',
        );
      }
    }

    let paymentMethod = PaymentMethod.MIXED;
    if (dto.payments.length === 1) {
      paymentMethod = dto.payments[0].method;
    }

    const attendant = await this.usersRepo.findOne({ where: { id: attendantId } });
    if (!attendant) {
      throw new BadRequestException('Attendant not found');
    }
    const discountPercent =
      subtotal > 0 ? round2((discount / subtotal) * 100) : 0;
    const needsDiscountApproval =
      discount > 0 &&
      !attendant.canOverridePrice &&
      discountPercent > toNumber(attendant.discountLimitPercent);

    const sale = this.salesRepo.create({
      receiptNumber: this.receiptNumber(station.code),
      stationId: dto.stationId,
      attendantId,
      customerId: dto.customerId,
      shiftId: dto.shiftId,
      subtotal: asDecimal(subtotal, 2),
      discountAmount: asDecimal(discount, 2),
      totalAmount: asDecimal(total, 2),
      lpgQuantityKg: asDecimal(lpgQuantityKg),
      paymentMethod,
      status: needsDiscountApproval
        ? SaleStatus.PENDING_APPROVAL
        : hasPaychangu
          ? SaleStatus.PENDING_PAYMENT
          : SaleStatus.COMPLETED,
      salesChannel,
      commercialStream,
      notes: dto.notes,
      clientTxnId: dto.clientTxnId,
      soldAt: new Date(),
      items: items as SaleItem[],
      payments: dto.payments.map((p) =>
        Object.assign(new SalePayment(), {
          method: p.method,
          amount: asDecimal(p.amount, 2),
          reference: p.reference,
        }),
      ),
    });

    const saved = await this.salesRepo.save(sale);

    if (needsDiscountApproval) {
      await this.auditService.log({
        userId: attendantId,
        action: 'SALE_PENDING_DISCOUNT',
        entityType: 'Sale',
        entityId: saved.id,
        newValues: {
          receiptNumber: saved.receiptNumber,
          discountPercent,
          discountLimit: attendant.discountLimitPercent,
        },
        stationId: dto.stationId,
      });
      return this.salesRepo.findOne({
        where: { id: saved.id },
        relations: {
          items: true,
          payments: true,
          station: true,
          attendant: true,
          customer: true,
        },
      });
    }

    if (hasPaychangu) {
      const operator =
        dto.paychanguOperator === PaymentMethod.TNM_MPAMBA
          ? PaymentMethod.TNM_MPAMBA
          : PaymentMethod.AIRTEL_MONEY;
      try {
        await this.paychanguService.initiatePayment({
          amount: total,
          paymentMethod: operator,
          customerPhone: dto.customerPhone!.trim(),
          internalRef: saved.receiptNumber,
          saleId: saved.id,
        });
      } catch (err) {
        saved.status = SaleStatus.VOIDED;
        saved.notes = [
          saved.notes,
          `PayChangu initiation failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        ]
          .filter(Boolean)
          .join(' · ');
        await this.salesRepo.save(saved);
        throw err;
      }
      return this.salesRepo.findOne({
        where: { id: saved.id },
        relations: {
          items: true,
          payments: true,
          station: true,
          attendant: true,
          customer: true,
        },
      });
    }

    await this.finalizeSale(saved, dto, attendantId, activePrice, items, salesChannel, lpgQuantityKg, total);

    return this.salesRepo.findOne({
      where: { id: saved.id },
      relations: { items: true, payments: true, station: true, attendant: true, customer: true },
    });
  }

  async approveDiscount(id: string, approverId: string, approverRole: UserRole) {
    if (!DISCOUNT_APPROVER_ROLES.has(approverRole)) {
      throw new ForbiddenException('Insufficient role to approve discounts');
    }

    const sale = await this.salesRepo.findOne({
      where: { id },
      relations: { items: true, payments: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status !== SaleStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Sale is not awaiting discount approval');
    }
    if (sale.attendantId === approverId) {
      throw new ForbiddenException('Cannot approve your own discounted sale');
    }

    const activePrice = await this.getActivePrice(sale.stationId);
    const lpgQuantityKg = toNumber(sale.lpgQuantityKg);
    const total = toNumber(sale.totalAmount);

    sale.status = SaleStatus.COMPLETED;
    await this.salesRepo.save(sale);

    const dtoLike: CreateSaleDto = {
      stationId: sale.stationId,
      shiftId: sale.shiftId!,
      customerId: sale.customerId ?? undefined,
      clientTxnId: sale.clientTxnId ?? undefined,
      salesChannel: sale.salesChannel,
      payments: (sale.payments ?? []).map((p) => ({
        method: p.method,
        amount: toNumber(p.amount),
        reference: p.reference,
      })),
      items: [],
    };

    await this.finalizeSale(
      sale,
      dtoLike,
      sale.attendantId,
      activePrice,
      sale.items ?? [],
      sale.salesChannel,
      lpgQuantityKg,
      total,
    );

    await this.auditService.log({
      userId: approverId,
      action: 'SALE_DISCOUNT_APPROVED',
      entityType: 'Sale',
      entityId: sale.id,
      stationId: sale.stationId,
    });

    return this.findOne(id);
  }

  async completePaychanguSale(saleId: string): Promise<Sale> {
    const sale = await this.salesRepo.findOne({
      where: { id: saleId },
      relations: { items: true, payments: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    if (sale.status === SaleStatus.COMPLETED) return this.findOne(saleId);
    if (sale.status !== SaleStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Sale is not awaiting PayChangu payment');
    }

    const activePrice = await this.getActivePrice(sale.stationId);
    const lpgQuantityKg = toNumber(sale.lpgQuantityKg);
    const total = toNumber(sale.totalAmount);

    sale.status = SaleStatus.COMPLETED;
    await this.salesRepo.save(sale);

    const dtoLike: CreateSaleDto = {
      stationId: sale.stationId,
      shiftId: sale.shiftId!,
      customerId: sale.customerId ?? undefined,
      clientTxnId: sale.clientTxnId ?? undefined,
      salesChannel: sale.salesChannel,
      payments: (sale.payments ?? []).map((p) => ({
        method: p.method,
        amount: toNumber(p.amount),
        reference: p.reference,
      })),
      items: [],
    };

    await this.finalizeSale(
      sale,
      dtoLike,
      sale.attendantId,
      activePrice,
      sale.items ?? [],
      sale.salesChannel,
      lpgQuantityKg,
      total,
    );

    await this.auditService.log({
      userId: sale.attendantId,
      action: 'SALE_PAYCHANGU_COMPLETED',
      entityType: 'Sale',
      entityId: sale.id,
      stationId: sale.stationId,
    });

    return this.findOne(saleId);
  }

  async failPaychanguSale(saleId: string, reason?: string): Promise<void> {
    const sale = await this.salesRepo.findOne({ where: { id: saleId } });
    if (!sale || sale.status !== SaleStatus.PENDING_PAYMENT) return;

    sale.status = SaleStatus.VOIDED;
    sale.notes = [sale.notes, reason ? `PayChangu failed: ${reason}` : 'PayChangu payment failed']
      .filter(Boolean)
      .join(' · ');
    await this.salesRepo.save(sale);
  }

  listPendingDiscounts(stationId?: string) {
    return this.salesRepo.find({
      where: {
        status: SaleStatus.PENDING_APPROVAL,
        ...(stationId ? { stationId } : {}),
      },
      order: { soldAt: 'DESC' },
      relations: { items: true, payments: true, station: true, attendant: true },
      take: 50,
    });
  }

  private async finalizeSale(
    saved: Sale,
    dto: CreateSaleDto,
    attendantId: string,
    activePrice: number,
    items: Partial<SaleItem>[],
    salesChannel: SalesChannel,
    lpgQuantityKg: number,
    total: number,
  ) {
    const hasCredit = dto.payments.some(
      (p) => p.method === PaymentMethod.CUSTOMER_ACCOUNT,
    );

    if (dto.bundleId) {
      const bundleTotal = round2(
        items.reduce((s, i) => s + toNumber(i.lineTotal), 0),
      );
      await this.financeService.postBundleSale(bundleTotal, saved.id);
    }

    if (lpgQuantityKg > 0) {
      await this.inventoryService.applyMovement({
        stationId: dto.stationId,
        type: StockMovementType.REFILL_SALE,
        quantityKg: -lpgQuantityKg,
        reason: `Sale ${saved.receiptNumber}`,
        referenceType: 'Sale',
        referenceId: saved.id,
        userId: attendantId,
        clientTxnId: dto.clientTxnId
          ? `stock-${dto.clientTxnId}`
          : undefined,
      });
      const station = await this.stationsService.findOne(dto.stationId);
      const costPerKg = toNumber(station.weightedAvgCostPerKg ?? 1200);
      const lpgRevenue = round2(lpgQuantityKg * activePrice);
      if (hasCredit) {
        await this.financeService.postCreditSale(
          lpgRevenue,
          saved.id,
          lpgQuantityKg,
          costPerKg,
        );
      } else {
        await this.financeService.postLpgRefillSale(
          lpgRevenue,
          saved.id,
          lpgQuantityKg,
          costPerKg,
        );
      }
    }

    const accessoryLines = items.filter(
      (i) => i.productId && toNumber(i.lpgQuantityKg) === 0 && toNumber(i.lineTotal) > 0,
    );
    if (accessoryLines.length) {
      const cogs = await this.accessoriesService.deductForSale(
        dto.stationId,
        accessoryLines.map((i) => ({
          productId: i.productId!,
          quantity: i.quantity ?? 1,
        })),
      );
      const accessoryTotal = round2(
        accessoryLines.reduce((s, i) => s + toNumber(i.lineTotal), 0),
      );
      await this.financeService.postAccessoryRetailSale(
        accessoryTotal,
        cogs,
        saved.id,
      );
    }

    if (hasCredit && dto.customerId) {
      await this.customersService.applyCredit(dto.customerId, total);
      const customer = await this.customersService.findOne(dto.customerId);
      void this.notificationsService.notifyCreditSale({
        phone: customer.phone,
        customerName: customer.fullName,
        amount: total,
        receiptNumber: saved.receiptNumber,
        balance: toNumber(customer.outstandingBalance),
      });
    }

    if (dto.customerId && !hasCredit) {
      void this.loyaltyService.earnFromSale(dto.customerId, total, saved.id);
    }

    if (
      salesChannel === SalesChannel.AGENT_COMMISSION &&
      dto.customerId
    ) {
      const commission = await this.franchiseService.accrueAgentCommission(
        saved.id,
        dto.customerId,
        total,
        8,
      );
      await this.financeService.postAgentCommission(
        toNumber(commission.commissionAmount),
        saved.id,
      );
    }

    await this.stationsService.touchSync(dto.stationId);
    await this.auditService.log({
      userId: attendantId,
      action: 'SALE_CREATED',
      entityType: 'Sale',
      entityId: saved.id,
      newValues: {
        receiptNumber: saved.receiptNumber,
        totalAmount: saved.totalAmount,
        lpgQuantityKg: saved.lpgQuantityKg,
      },
      stationId: dto.stationId,
    });
  }

  findAll(stationId?: string) {
    return this.salesRepo.find({
      where: stationId ? { stationId } : {},
      order: { soldAt: 'DESC' },
      take: 100,
      relations: { items: true, payments: true, station: true, attendant: true },
    });
  }

  async findOne(id: string) {
    const sale = await this.salesRepo.findOne({
      where: { id },
      relations: { items: true, payments: true, station: true, attendant: true, customer: true },
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    return sale;
  }

  async todaySummary(stationId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await this.salesRepo.find({
      where: {
        soldAt: Between(start, end),
        status: SaleStatus.COMPLETED,
        ...(stationId ? { stationId } : {}),
      },
    });

    return {
      transactionCount: sales.length,
      totalRevenue: round2(
        sales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0),
      ),
      totalKgSold: round3(
        sales.reduce((sum, s) => sum + toNumber(s.lpgQuantityKg), 0),
      ),
      byPaymentMethod: Object.values(PaymentMethod).reduce(
        (acc, method) => {
          acc[method] = round2(
            sales
              .filter((s) => s.paymentMethod === method)
              .reduce((sum, s) => sum + toNumber(s.totalAmount), 0),
          );
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async voidSale(id: string, userId: string, reason: string) {
    const sale = await this.findOne(id);
    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException('Only completed sales can be voided');
    }

    await this.financeService.reverseAllForReference('Sale', id, reason);

    const lpgQty = toNumber(sale.lpgQuantityKg);
    if (lpgQty > 0) {
      await this.inventoryService.applyMovement({
        stationId: sale.stationId,
        type: StockMovementType.STOCK_ADJUSTMENT,
        quantityKg: lpgQty,
        reason: `Void sale ${sale.receiptNumber}: ${reason}`,
        referenceType: 'Sale',
        referenceId: sale.id,
        userId,
      });
    }

    const hasCredit = (sale.payments ?? []).some(
      (p) => p.method === PaymentMethod.CUSTOMER_ACCOUNT,
    );
    if (hasCredit && sale.customerId) {
      await this.customersService.relieveCredit(
        sale.customerId,
        toNumber(sale.totalAmount),
      );
    }

    sale.status = SaleStatus.VOIDED;
    await this.salesRepo.save(sale);

    await this.auditService.log({
      userId,
      action: 'SALE_VOIDED',
      entityType: 'Sale',
      entityId: sale.id,
      newValues: { reason, receiptNumber: sale.receiptNumber },
      stationId: sale.stationId,
    });

    return sale;
  }

  private offlinePayloadConflict(existing: Sale, dto: CreateSaleDto): boolean {
    return (
      this.offlinePayloadFingerprint(dto) !==
      this.saleOfflineFingerprint(existing)
    );
  }

  private offlinePayloadFingerprint(dto: CreateSaleDto): string {
    return JSON.stringify({
      stationId: dto.stationId,
      shiftId: dto.shiftId ?? null,
      customerId: dto.customerId ?? null,
      items: (dto.items ?? []).map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lpgQuantityKg: i.lpgQuantityKg ?? 0,
      })),
      payments: dto.payments.map((p) => ({
        method: p.method,
        amount: p.amount,
      })),
    });
  }

  private saleOfflineFingerprint(sale: Sale): string {
    return JSON.stringify({
      stationId: sale.stationId,
      shiftId: sale.shiftId ?? null,
      customerId: sale.customerId ?? null,
      items: (sale.items ?? []).map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: toNumber(i.unitPrice),
        lpgQuantityKg: toNumber(i.lpgQuantityKg),
      })),
      payments: (sale.payments ?? []).map((p) => ({
        method: p.method,
        amount: toNumber(p.amount),
      })),
    });
  }
}
