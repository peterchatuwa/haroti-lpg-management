import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../expenses/expense.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { TanksModule } from '../tanks/tanks.module';
import { Tank } from '../tanks/tank.entity';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';
import { Station } from './station.entity';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Station, Sale, Shift, Expense, Tank]),
    forwardRef(() => TanksModule),
  ],
  controllers: [StationsController, NetworkController],
  providers: [StationsService, NetworkService],
  exports: [StationsService, NetworkService],
})
export class StationsModule {}
