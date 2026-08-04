import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/audit-log.entity';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Expense } from '../expenses/expense.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { StationsModule } from '../stations/stations.module';
import { Transfer } from '../transfers/transfer.entity';
import { Requisition } from '../requisitions/requisition.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    StationsModule,
    TypeOrmModule.forFeature([
      Sale,
      Expense,
      Customer,
      Cylinder,
      Shift,
      Transfer,
      AuditLog,
      Requisition,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
