import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { PaycController } from './payc.controller';
import { PaycCreditTransaction } from './payc-credit-transaction.entity';
import { PaycMeter } from './payc-meter.entity';
import { PaycService } from './payc.service';
import { PaycTelemetry } from './payc-telemetry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaycMeter,
      PaycTelemetry,
      PaycCreditTransaction,
    ]),
    FinanceModule,
  ],
  controllers: [PaycController],
  providers: [PaycService],
  exports: [PaycService],
})
export class PaycModule {}
