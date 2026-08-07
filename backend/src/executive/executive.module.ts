import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionCentreModule } from '../action-centre/action-centre.module';
import { ReportsModule } from '../reports/reports.module';
import { Sale } from '../sales/sale.entity';
import { Station } from '../stations/station.entity';
import { TargetsModule } from '../targets/targets.module';
import { TanksModule } from '../tanks/tanks.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ExecutiveController } from './executive.controller';
import { ExecutiveService } from './executive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, Station]),
    ReportsModule,
    ActionCentreModule,
    TanksModule,
    TargetsModule,
    AnalyticsModule,
  ],
  controllers: [ExecutiveController],
  providers: [ExecutiveService],
})
export class ExecutiveModule {}
