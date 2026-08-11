import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Customer } from '../customers/customer.entity';
import { JournalEntry } from '../finance/journal-entry.entity';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { PurchaseOrder } from '../procurement/purchase-order.entity';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Sale,
      Cylinder,
      PurchaseOrder,
      Supplier,
      JournalEntry,
      MaintenanceWorkOrder,
      Station,
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
