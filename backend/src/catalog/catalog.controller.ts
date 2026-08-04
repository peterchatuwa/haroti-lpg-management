import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Product } from '../products/product.entity';
import { Supplier } from '../suppliers/supplier.entity';

@UseGuards(JwtAuthGuard)
@Controller()
export class CatalogController {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Supplier)
    private readonly suppliersRepo: Repository<Supplier>,
    @InjectRepository(Cylinder)
    private readonly cylindersRepo: Repository<Cylinder>,
  ) {}

  @Get('products')
  products() {
    return this.productsRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

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
      order: { name: 'ASC' },
    });
  }
}
