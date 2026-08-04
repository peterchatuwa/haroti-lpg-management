import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Asset } from './asset.entity';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceScheduler } from './maintenance.scheduler';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceWorkOrder } from './work-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceWorkOrder, Cylinder, Asset]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceScheduler],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
