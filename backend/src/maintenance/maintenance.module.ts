import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cylinder } from '../cylinders/cylinder.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Asset } from './asset.entity';
import { MaintenanceController } from './maintenance.controller';
import { MaintenancePlan } from './maintenance-plan.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceWorkOrder } from './work-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceWorkOrder,
      Cylinder,
      Asset,
      MaintenancePlan,
    ]),
    NotificationsModule,
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
