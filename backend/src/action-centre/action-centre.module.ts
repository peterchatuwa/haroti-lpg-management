import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationScopeModule } from '../auth/station-scope.module';
import { Expense } from '../expenses/expense.entity';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { PurchaseOrder } from '../procurement/purchase-order.entity';
import { Requisition } from '../requisitions/requisition.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { LossCase } from '../tanks/loss-case.entity';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ActionCentreController } from './action-centre.controller';
import { ActionCentreService } from './action-centre.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      Shift,
      Expense,
      Requisition,
      PurchaseOrder,
      LossCase,
      MaintenanceWorkOrder,
    ]),
    StationScopeModule,
    WorkflowsModule,
  ],
  controllers: [ActionCentreController],
  providers: [ActionCentreService],
  exports: [ActionCentreService],
})
export class ActionCentreModule {}
