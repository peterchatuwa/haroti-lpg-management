import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerPayment } from '../customers/customer-payment.entity';
import { SalePayment } from '../sales/sale-payment.entity';
import { BankAccount } from './bank-account.entity';
import { BankStatementLine } from './bank-statement-line.entity';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { CashDeposit } from './cash-deposit.entity';
import { MobileMoneyLine } from './mobile-money-line.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MobileMoneyLine,
      SalePayment,
      BankAccount,
      BankStatementLine,
      CashDeposit,
      CustomerPayment,
    ]),
  ],
  controllers: [BankingController],
  providers: [BankingService],
  exports: [BankingService],
})
export class BankingModule {}
