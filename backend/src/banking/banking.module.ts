import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalePayment } from '../sales/sale-payment.entity';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { MobileMoneyLine } from './mobile-money-line.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MobileMoneyLine, SalePayment])],
  controllers: [BankingController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
