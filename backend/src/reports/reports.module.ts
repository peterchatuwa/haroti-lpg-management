import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { FranchiseModule } from '../franchise/franchise.module';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { PaycModule } from '../payc/payc.module';
import { ProjectsModule } from '../projects/projects.module';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, Station, MaintenanceWorkOrder]),
    FinanceModule,
    PaycModule,
    ProjectsModule,
    FranchiseModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
