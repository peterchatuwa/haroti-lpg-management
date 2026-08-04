import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { CylinderMovement } from './cylinder-movement.entity';
import { Cylinder } from './cylinder.entity';
import { CylindersController } from './cylinders.controller';
import { CylindersService } from './cylinders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cylinder, CylinderMovement, Customer]),
  ],
  controllers: [CylindersController],
  providers: [CylindersService],
  exports: [CylindersService],
})
export class CylindersModule {}
