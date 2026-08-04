import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationScopeModule } from '../auth/station-scope.module';
import { FinanceModule } from '../finance/finance.module';
import { RequisitionLine } from './requisition-line.entity';
import { Requisition } from './requisition.entity';
import { RequisitionsController } from './requisitions.controller';
import { RequisitionsService } from './requisitions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Requisition, RequisitionLine]),
    FinanceModule,
    StationScopeModule,
  ],
  controllers: [RequisitionsController],
  providers: [RequisitionsService],
  exports: [RequisitionsService],
})
export class RequisitionsModule {}
