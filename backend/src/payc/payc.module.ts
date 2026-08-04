import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceModule } from '../finance/finance.module';
import { PaycController } from './payc.controller';
import { PaycMeter } from './payc-meter.entity';
import { PaycService } from './payc.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaycMeter]), FinanceModule],
  controllers: [PaycController],
  providers: [PaycService],
  exports: [PaycService],
})
export class PaycModule {}
