import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerPayment } from '../customers/customer-payment.entity';
import { Customer } from '../customers/customer.entity';
import { PurchaseOrder } from '../procurement/purchase-order.entity';
import { Sale } from '../sales/sale.entity';
import { AgeingController } from './ageing.controller';
import { AgeingService } from './ageing.service';
import { BudgetLine } from './budget-line.entity';
import { FiscalPeriodController } from './fiscal-period.controller';
import {
  FiscalPeriodService,
  PostingRuleService,
} from './fiscal-period.service';
import { FiscalPeriod } from './fiscal-period.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';
import { PostingRule } from './posting-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JournalEntry,
      JournalLine,
      BudgetLine,
      FiscalPeriod,
      PostingRule,
      Customer,
      CustomerPayment,
      Sale,
      PurchaseOrder,
    ]),
  ],
  controllers: [FinanceController, FiscalPeriodController, AgeingController],
  providers: [
    FinanceService,
    FiscalPeriodService,
    PostingRuleService,
    AgeingService,
  ],
  exports: [
    FinanceService,
    FiscalPeriodService,
    PostingRuleService,
    AgeingService,
  ],
})
export class FinanceModule {}
