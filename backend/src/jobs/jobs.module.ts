import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { TanksModule } from '../tanks/tanks.module';
import { JobRun } from './job-run.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([JobRun]),
    MaintenanceModule,
    TanksModule,
    FinanceModule,
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
