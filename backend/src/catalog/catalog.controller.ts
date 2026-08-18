import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Supplier } from '../suppliers/supplier.entity';

@UseGuards(JwtAuthGuard)
@Controller()
export class CatalogController {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
    @InjectRepository(Cylinder)
    private readonly cylindersRepo: Repository<Cylinder>,
  ) {}

  @Get('customers')
  customers(@Query('stationId') stationId?: string) {
    return this.customersRepo.find({
      where: stationId ? { stationId } : {},
      order: { fullName: 'ASC' },
      take: 200,
    });
  }

  @Get('suppliers')
  suppliers() {
    return this.suppliersRepo.find({
      where: { isActive: true },
      relations: { customer: true },
      order: { name: 'ASC' },
    });
  }
}
