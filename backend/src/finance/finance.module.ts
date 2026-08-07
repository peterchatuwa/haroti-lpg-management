import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    ]),
  ],
  controllers: [FinanceController, FiscalPeriodController],
  providers: [FinanceService, FiscalPeriodService, PostingRuleService],
  exports: [FinanceService, FiscalPeriodService, PostingRuleService],
})
export class FinanceModule {}
