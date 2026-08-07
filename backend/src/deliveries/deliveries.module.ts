import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { StationsModule } from '../stations/stations.module';
import { TanksModule } from '../tanks/tanks.module';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { DeliveryAllocation } from './delivery-allocation.entity';
import { Delivery } from './delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, DeliveryAllocation]),
    InventoryModule,
    StationsModule,
    FinanceModule,
    TanksModule,
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
