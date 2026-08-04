import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from '../expenses/expense.entity';
import { Sale } from '../sales/sale.entity';
import { StationsModule } from '../stations/stations.module';
import { TanksModule } from '../tanks/tanks.module';
import { Shift } from './shift.entity';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shift, Sale, Expense]),
    StationsModule,
    TanksModule,
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
