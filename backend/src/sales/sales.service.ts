import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AccessoriesService } from '../accessories/accessories.service';
import { CustomersService } from '../customers/customers.service';
import { asDecimal, round2, round3, toNumber } from '../common/decimal';
import {
  CommercialStream,
  PaymentMethod,
  SaleStatus,
  SalesChannel,
  StockMovementType,
} from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { InventoryService } from '../inventory/inventory.service';
import { PriceList } from '../pricing/price-list.entity';
import { StationsService } from '../stations/stations.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';
import { Sale } from './sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale) private readonly salesRepo: Repository<Sale>,
    @InjectRepository(PriceList)
    private readonly pricesRepo: Repository<PriceList>,
    private readonly inventoryService: InventoryService,
    private readonly stationsService: StationsService,
    private readonly auditService: AuditService,
    private readonly accessoriesService: AccessoriesService,
    private readonly financeService: FinanceService,
    private readonly customersService: CustomersService,
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
        return existing;
      }
    }

    if (!dto.items?.length && !dto.bundleId) {
      throw new BadRequestException('Sale must include at least one item');
    }

    const station = await this.stationsService.findOne(dto.stationId);
    const activePrice = await this.getActivePrice(dto.stationId);
    const salesChannel = dto.salesChannel ?? SalesChannel.RETAIL_LIST;
    const commercialStream =
      station.commercialStream ?? CommercialStream.RETAIL_FORECOURT;

    let saleItems = dto.items ?? [];

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

    let paymentMethod = PaymentMethod.MIXED;
    if (dto.payments.length === 1) {
      paymentMethod = dto.payments[0].method;
    }

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
      status: SaleStatus.COMPLETED,
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
      await this.financeService.postLpgRefillSale(
        round2(lpgQuantityKg * activePrice),
        saved.id,
      );
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

    return this.salesRepo.findOne({
      where: { id: saved.id },
      relations: { items: true, payments: true, station: true, attendant: true, customer: true },
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
}
