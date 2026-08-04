import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoriesModule } from '../accessories/accessories.module';
import { FinanceModule } from '../finance/finance.module';
import { Supplier } from '../suppliers/supplier.entity';
import { ProcurementDocument } from './procurement-document.entity';
import { ProcurementDocumentsService } from './procurement-documents.service';
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      ProcurementDocument,
      Supplier,
    ]),
    FinanceModule,
    AccessoriesModule,
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService, ProcurementDocumentsService],
})
export class ProcurementModule {}
