import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cylinder } from '../cylinders/cylinder.entity';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceWorkOrder } from './work-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceWorkOrder, Cylinder])],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}
