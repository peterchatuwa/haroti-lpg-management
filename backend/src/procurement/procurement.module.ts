import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoriesModule } from '../accessories/accessories.module';
import { FinanceModule } from '../finance/finance.module';
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderLine]),
    FinanceModule,
    AccessoriesModule,
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService],
})
export class ProcurementModule {}
