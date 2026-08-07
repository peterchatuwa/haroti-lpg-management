import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from '../deliveries/delivery.entity';
import { StockMovement } from '../inventory/stock-movement.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { Station } from '../stations/station.entity';
import { LossCase } from '../tanks/loss-case.entity';
import { TanksModule } from '../tanks/tanks.module';
import { AiInsightsController } from './ai-insights.controller';
import { AiInsightsService } from './ai-insights.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      Shift,
      StockMovement,
      LossCase,
      Delivery,
      Station,
    ]),
    TanksModule,
  ],
  controllers: [AiInsightsController],
  providers: [AiInsightsService],
  exports: [AiInsightsService],
})
export class AiModule {}
