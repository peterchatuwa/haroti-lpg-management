import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/audit-log.entity';
import { AuditService } from '../audit/audit.service';
import { InventoryModule } from '../inventory/inventory.module';
import { PriceList } from '../pricing/price-list.entity';
import { StationsModule } from '../stations/stations.module';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';
import { Sale } from './sale.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, SalePayment, PriceList, AuditLog]),
    InventoryModule,
    StationsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService, AuditService],
  exports: [SalesService],
})
export class SalesModule {}
