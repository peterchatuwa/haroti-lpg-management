import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { PriceList } from '../pricing/price-list.entity';
import { Product } from '../products/product.entity';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { User } from '../users/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Station,
      User,
      Supplier,
      Product,
      Customer,
      Cylinder,
      PriceList,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
