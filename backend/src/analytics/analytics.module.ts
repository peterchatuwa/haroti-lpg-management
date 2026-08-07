import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LossCase } from '../tanks/loss-case.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { TargetsModule } from '../targets/targets.module';
import { User } from '../users/user.entity';
import { AnalyticsController } from './analytics.controller';
import { StaffAnalyticsService } from './staff-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, Shift, User, LossCase]),
    TargetsModule,
  ],
  controllers: [AnalyticsController],
  providers: [StaffAnalyticsService],
  exports: [StaffAnalyticsService],
})
export class AnalyticsModule {}
