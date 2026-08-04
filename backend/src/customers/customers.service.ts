import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, toNumber } from '../common/decimal';
import { Customer } from './customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
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
}
