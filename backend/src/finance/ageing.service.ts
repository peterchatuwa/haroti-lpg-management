import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { round2, toNumber } from '../common/decimal';
import { PaymentMethod, PurchaseOrderStatus, SaleStatus } from '../common/enums';
import { Customer } from '../customers/customer.entity';
import { CustomerPayment } from '../customers/customer-payment.entity';
import { PurchaseOrder } from '../procurement/purchase-order.entity';
import { Sale } from '../sales/sale.entity';

export type AgeingBucket =
  | 'current'
  | 'days1_30'
  | 'days31_60'
  | 'days61_90'
  | 'days90_plus';

@Injectable()
export class AgeingService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
    @InjectRepository(CustomerPayment)
    private readonly paymentsRepo: Repository<CustomerPayment>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
  ) {}

  private bucketForAge(days: number): AgeingBucket {
    if (days <= 0) return 'current';
    if (days <= 30) return 'days1_30';
    if (days <= 60) return 'days31_60';
    if (days <= 90) return 'days61_90';
    return 'days90_plus';
  }

  async arAgeing(stationId?: string) {
    const customers = await this.customersRepo.find({
      where: stationId ? { stationId } : {},
      relations: { station: true },
    });

    const buckets: Record<AgeingBucket, number> = {
      current: 0,
      days1_30: 0,
      days31_60: 0,
      days61_90: 0,
      days90_plus: 0,
    };

    const overdue: Array<{
      customerId: string;
      customerCode: string;
      fullName: string;
      stationCode?: string;
      balance: number;
      oldestDays: number;
      bucket: AgeingBucket;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const customer of customers) {
      const balance = toNumber(customer.outstandingBalance);
      if (balance <= 0) continue;

      const sales = await this.salesRepo.find({
        where: { customerId: customer.id, status: SaleStatus.COMPLETED },
        relations: { payments: true },
        order: { soldAt: 'ASC' },
      });

      const creditSales = sales.filter((sale) =>
        (sale.payments ?? []).some(
          (p) => p.method === PaymentMethod.CUSTOMER_ACCOUNT,
        ),
      );

      let remaining = balance;
      let oldestDays = 0;

      for (const sale of creditSales) {
        if (remaining <= 0) break;
        const amount = toNumber(sale.totalAmount);
        const alloc = Math.min(remaining, amount);
        remaining -= alloc;
        const days = Math.floor(
          (today.getTime() - sale.soldAt.getTime()) / 86400000,
        );
        if (alloc > 0) {
          buckets[this.bucketForAge(days)] += alloc;
          oldestDays = Math.max(oldestDays, days);
        }
      }

      if (remaining > 0) {
        buckets.days90_plus += remaining;
        oldestDays = Math.max(oldestDays, 91);
      }

      overdue.push({
        customerId: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        stationCode: customer.station?.code,
        balance: round2(balance),
        oldestDays,
        bucket: this.bucketForAge(oldestDays),
      });
    }

    overdue.sort((a, b) => b.balance - a.balance);

    return {
      buckets: Object.fromEntries(
        Object.entries(buckets).map(([k, v]) => [k, round2(v)]),
      ),
      total: round2(Object.values(buckets).reduce((s, v) => s + v, 0)),
      overdueAccounts: overdue.slice(0, 50),
    };
  }

  async apAgeing() {
    const pos = await this.poRepo.find({
      where: { status: PurchaseOrderStatus.RECEIVED },
      relations: { supplier: true },
      order: { updatedAt: 'ASC' },
    });

    const buckets: Record<AgeingBucket, number> = {
      current: 0,
      days1_30: 0,
      days31_60: 0,
      days61_90: 0,
      days90_plus: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const termsDays = 30;

    const lines = pos.map((po) => {
      const receivedAt = po.updatedAt;
      const dueDate = new Date(receivedAt);
      dueDate.setDate(dueDate.getDate() + termsDays);
      const days = Math.floor(
        (today.getTime() - dueDate.getTime()) / 86400000,
      );
      const amount = toNumber(po.totalAmount);
      const bucket = this.bucketForAge(Math.max(0, days));
      buckets[bucket] += amount;
      return {
        purchaseOrderId: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplier?.name,
        amount: round2(amount),
        receivedAt: receivedAt.toISOString().slice(0, 10),
        dueDate: dueDate.toISOString().slice(0, 10),
        daysOverdue: Math.max(0, days),
        bucket,
      };
    });

    return {
      buckets: Object.fromEntries(
        Object.entries(buckets).map(([k, v]) => [k, round2(v)]),
      ),
      total: round2(Object.values(buckets).reduce((s, v) => s + v, 0)),
      unpaidOrders: lines,
    };
  }

  snapshot() {
    return Promise.all([this.arAgeing(), this.apAgeing()]).then(
      ([ar, ap]) => ({ generatedAt: new Date().toISOString(), ar, ap }),
    );
  }
}
