import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from '../inventory/stock-movement.entity';
import { Station } from '../stations/station.entity';
import { LossCase } from './loss-case.entity';
import { TankReading } from './tank-reading.entity';
import { Tank } from './tank.entity';
import { TanksController } from './tanks.controller';
import { TanksService } from './tanks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tank,
      TankReading,
      LossCase,
      StockMovement,
      Station,
    ]),
  ],
  controllers: [TanksController],
  providers: [TanksService],
  exports: [TanksService],
})
export class TanksModule {}
