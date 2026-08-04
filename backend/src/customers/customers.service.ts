import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2, toNumber } from '../common/decimal';
import { PaymentMethod, SaleStatus } from '../common/enums';
import { Sale } from '../sales/sale.entity';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly salesRepo: Repository<Sale>,
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
    const qb = this.salesRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.station', 'station')
      .leftJoinAndSelect('s.payments', 'payments')
      .where('s.customer_id = :customerId', { customerId })
      .andWhere('s.status = :status', { status: SaleStatus.COMPLETED });

    if (from) {
      qb.andWhere('s.sold_at >= :from', { from: new Date(from) });
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('s.sold_at <= :to', { to: end });
    }

    const sales = await qb.orderBy('s.sold_at', 'ASC').getMany();

    let runningBalance = 0;
    const lines: Array<{
      date: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
      balance: number;
      stationCode?: string;
    }> = [];

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

      runningBalance = round2(runningBalance + amount);
      lines.push({
        date: sale.soldAt.toISOString().slice(0, 10),
        reference: sale.receiptNumber,
        description: `Credit sale · ${sale.station?.code ?? ''}`,
        debit: amount,
        credit: 0,
        balance: runningBalance,
        stationCode: sale.station?.code,
      });
    }

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
