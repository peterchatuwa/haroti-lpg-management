import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetLine } from './budget-line.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JournalEntry, JournalLine, BudgetLine]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
