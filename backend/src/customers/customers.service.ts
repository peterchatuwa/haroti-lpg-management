import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { PaymentMethod, SaleStatus } from '../common/enums';
import { FinanceService } from '../finance/finance.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Sale } from '../sales/sale.entity';
import { CustomerPayment } from './customer-payment.entity';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RecordCustomerPaymentDto } from './dto/record-customer-payment.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
    @InjectRepository(CustomerPayment)
    private readonly paymentsRepo: Repository<CustomerPayment>,
    private readonly financeService: FinanceService,
    private readonly notificationsService: NotificationsService,
  ) {}

  findAll(stationId?: string) {
    return this.customersRepo.find({
      where: stationId ? { stationId } : {},
      order: { fullName: 'ASC' },
      take: 500,
    });
  }

  async findOne(id: string) {
    const customer = await this.customersRepo.findOne({
      where: { id },
      relations: { station: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const code = dto.customerCode ?? `CUS-${Date.now().toString().slice(-6)}`;
    return this.customersRepo.save(
      this.customersRepo.create({
        ...dto,
        customerCode: code,
        creditLimit: asDecimal(dto.creditLimit ?? 0, 2),
        outstandingBalance: asDecimal(0, 2),
        contractPricePerKg: dto.contractPricePerKg
          ? asDecimal(dto.contractPricePerKg, 2)
          : undefined,
      }),
    );
  }

  async checkCredit(customerId: string, amount: number) {
    const customer = await this.findOne(customerId);
    if (customer.isSuspended) {
      throw new BadRequestException('Customer account is suspended');
    }
    const available =
      toNumber(customer.creditLimit) - toNumber(customer.outstandingBalance);
    if (amount > available) {
      throw new BadRequestException(
        `Credit limit exceeded. Available: MWK ${available.toFixed(2)}`,
      );
    }
    return customer;
  }

  async applyCredit(customerId: string, amount: number) {
    const customer = await this.findOne(customerId);
    customer.outstandingBalance = asDecimal(
      toNumber(customer.outstandingBalance) + amount,
      2,
    );
    return this.customersRepo.save(customer);
  }

  async relieveCredit(customerId: string, amount: number) {
    const customer = await this.findOne(customerId);
    customer.outstandingBalance = asDecimal(
      Math.max(0, toNumber(customer.outstandingBalance) - amount),
      2,
    );
    return this.customersRepo.save(customer);
  }

  async recordPayment(
    customerId: string,
    dto: RecordCustomerPaymentDto,
    receivedById: string,
  ) {
    if (dto.clientTxnId) {
      const existing = await this.paymentsRepo.findOne({
        where: { clientTxnId: dto.clientTxnId },
      });
      if (existing) return existing;
    }

    const customer = await this.findOne(customerId);
    const amount = round2(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be positive');
    }

    const payment = await this.paymentsRepo.save(
      this.paymentsRepo.create({
        customerId,
        amount: asDecimal(amount, 2),
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        receivedById,
        paidAt: new Date(),
        clientTxnId: dto.clientTxnId,
      }),
    );

    customer.outstandingBalance = asDecimal(
      Math.max(0, toNumber(customer.outstandingBalance) - amount),
      2,
    );
    await this.customersRepo.save(customer);
    await this.financeService.postCustomerPayment(amount, payment.id);

    void this.notificationsService.notifyPaymentReceived({
      phone: customer.phone,
      customerName: customer.fullName,
      amount,
      balance: toNumber(customer.outstandingBalance),
    });

    return payment;
  }

  async topDebtors(limit = 10) {
    return this.customersRepo.find({
      where: {},
      order: { outstandingBalance: 'DESC' },
      take: limit,
      relations: { station: true },
    });
  }

  async statement(customerId: string, from?: string, to?: string) {
    const customer = await this.findOne(customerId);

    const salesQb = this.salesRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.station', 'station')
      .leftJoinAndSelect('s.payments', 'payments')
      .where('s.customer_id = :customerId', { customerId })
      .andWhere('s.status = :status', { status: SaleStatus.COMPLETED });

    if (from) {
      salesQb.andWhere('s.sold_at >= :from', { from: new Date(from) });
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      salesQb.andWhere('s.sold_at <= :to', { to: end });
    }

    const sales = await salesQb.orderBy('s.sold_at', 'ASC').getMany();

    const paymentsQb = this.paymentsRepo
      .createQueryBuilder('p')
      .where('p.customer_id = :customerId', { customerId });

    if (from) {
      paymentsQb.andWhere('p.paid_at >= :from', { from: new Date(from) });
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      paymentsQb.andWhere('p.paid_at <= :to', { to: end });
    }

    const payments = await paymentsQb.orderBy('p.paid_at', 'ASC').getMany();

    type StmtLine = {
      date: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
      stationCode?: string;
      sortAt: number;
    };

    const rawLines: StmtLine[] = [];

    for (const sale of sales) {
      const creditPayment = (sale.payments ?? []).find(
        (p) => p.method === PaymentMethod.CUSTOMER_ACCOUNT,
      );
      const amount = creditPayment
        ? toNumber(creditPayment.amount)
        : sale.customerId
          ? toNumber(sale.totalAmount)
          : 0;

      if (amount <= 0) continue;

      rawLines.push({
        date: sale.soldAt.toISOString().slice(0, 10),
        reference: sale.receiptNumber,
        description: `Credit sale · ${sale.station?.code ?? ''}`,
        debit: amount,
        credit: 0,
        balance: 0,
        stationCode: sale.station?.code,
        sortAt: sale.soldAt.getTime(),
      });
    }

    for (const payment of payments) {
      const amount = toNumber(payment.amount);
      rawLines.push({
        date: payment.paidAt.toISOString().slice(0, 10),
        reference: payment.reference ?? `PAY-${payment.id.slice(0, 8)}`,
        description: `Payment · ${payment.paymentMethod.replaceAll('_', ' ')}`,
        debit: 0,
        credit: amount,
        balance: 0,
        sortAt: payment.paidAt.getTime(),
      });
    }

    rawLines.sort((a, b) => a.sortAt - b.sortAt);

    let runningBalance = 0;
    const lines = rawLines.map((line) => {
      runningBalance = round2(runningBalance + line.debit - line.credit);
      const { sortAt: _sortAt, ...rest } = line;
      return { ...rest, balance: runningBalance };
    });

    return {
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        fullName: customer.fullName,
        phone: customer.phone,
        type: customer.type,
        creditLimit: toNumber(customer.creditLimit),
        outstandingBalance: toNumber(customer.outstandingBalance),
        isSuspended: customer.isSuspended,
        station: customer.station,
      },
      periodStart: from ?? null,
      periodEnd: to ?? null,
      lines,
      closingBalance: toNumber(customer.outstandingBalance),
    };
  }
}

