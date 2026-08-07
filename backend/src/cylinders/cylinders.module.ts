import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { CylinderMovement } from './cylinder-movement.entity';
import { CylinderStocktakeLine } from './cylinder-stocktake-line.entity';
import { CylinderStocktake } from './cylinder-stocktake.entity';
import { Cylinder } from './cylinder.entity';
import { CylindersController } from './cylinders.controller';
import { CylindersService } from './cylinders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cylinder,
      CylinderMovement,
      CylinderStocktake,
      CylinderStocktakeLine,
      Customer,
      MaintenanceWorkOrder,
    ]),
  ],
  controllers: [CylindersController],
  providers: [CylindersService],
  exports: [CylindersService],
})
export class CylindersModule {}
