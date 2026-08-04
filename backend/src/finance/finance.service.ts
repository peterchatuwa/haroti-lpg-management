import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { asDecimal, round2 } from '../common/decimal';
import { Currency, JournalEventType } from '../common/enums';
import { BudgetLine } from './budget-line.entity';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';

/** GL account codes aligned to Charter §4 accounting matrix. */
export const GL_ACCOUNTS = {
  INVENTORY_CENTRAL: { code: '1200', name: 'Inventory: Accessories (Central Hub)' },
  INVENTORY_STATION: { code: '1210', name: 'Inventory: Station Accessories' },
  INVENTORY_CONSIGNMENT: { code: '1220', name: 'Inventory: Franchise Consignment' },
  INVENTORY_BULK_LPG: { code: '1250', name: 'Inventory: Bulk LPG' },
  ACCOUNTS_PAYABLE: { code: '2100', name: 'Accounts Payable' },
  CASH: { code: '1100', name: 'Cash-in-Hand / Mobile Money Clearing' },
  AR_FRANCHISE: { code: '1300', name: 'Accounts Receivable: Franchise' },
  REVENUE_ACCESSORY: { code: '4100', name: 'Revenue: Accessory Sales' },
  REVENUE_BUNDLE: { code: '4110', name: 'Revenue: Accessory Bundles' },
  REVENUE_LPG: { code: '4200', name: 'Revenue: LPG Refill Sales' },
  REVENUE_PAYC: { code: '4300', name: 'Revenue: PAYC Burn' },
  COGS_LPG: { code: '5200', name: 'COGS: LPG Refill Sales' },
  COGS_ACCESSORY: { code: '5100', name: 'COGS: Accessories' },
  DEFERRED_PAYC: { code: '2300', name: 'Deferred Revenue: PAYC Credit' },
  CWIP: { code: '1400', name: 'Capital Work-in-Progress (CWIP)' },
  COMMISSION_PAYABLE: { code: '2200', name: 'Commission Payable: Agents' },
  EXPENSE_STATION: { code: '6100', name: 'Station Operating Expenses' },
  PETTY_CASH: { code: '1110', name: 'Petty Cash' },
} as const;

/** Default bulk LPG inventory cost (MWK/kg) until tank costing is implemented. */
export const DEFAULT_LPG_COST_PER_KG = 1200;

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly entriesRepo: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private readonly linesRepo: Repository<JournalLine>,
    @InjectRepository(BudgetLine)
    private readonly budgetRepo: Repository<BudgetLine>,
  ) {}

  private entryNumber(event: JournalEventType) {
    const stamp = Date.now().toString().slice(-8);
    return `JE-${event.slice(0, 4)}-${stamp}`;
  }

  async postEntry(params: {
    eventType: JournalEventType;
    description: string;
    referenceType?: string;
    referenceId?: string;
    currency?: Currency;
    lines: Array<{
      account: (typeof GL_ACCOUNTS)[keyof typeof GL_ACCOUNTS];
      debit?: number;
      credit?: number;
    }>;
  }) {
    const entry = this.entriesRepo.create({
      entryNumber: this.entryNumber(params.eventType),
      eventType: params.eventType,
      description: params.description,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      currency: params.currency ?? Currency.MWK,
      lines: params.lines.map((l) =>
        this.linesRepo.create({
          accountCode: l.account.code,
          accountName: l.account.name,
          debitAmount: asDecimal(l.debit ?? 0, 2),
          creditAmount: asDecimal(l.credit ?? 0, 2),
        }),
      ),
    });
    return this.entriesRepo.save(entry);
  }

  async postAccessoryRetailSale(amount: number, cogs: number, refId: string) {
    await this.postEntry({
      eventType: JournalEventType.ACCESSORY_RETAIL_SALE,
      description: `Accessory retail sale ${refId}`,
      referenceType: 'Sale',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.CASH, debit: amount },
        { account: GL_ACCOUNTS.REVENUE_ACCESSORY, credit: amount },
      ],
    });
    if (cogs > 0) {
      await this.postEntry({
        eventType: JournalEventType.ACCESSORY_COGS,
        description: `Accessory COGS ${refId}`,
        referenceType: 'Sale',
        referenceId: refId,
        lines: [
          { account: GL_ACCOUNTS.COGS_ACCESSORY, debit: cogs },
          { account: GL_ACCOUNTS.INVENTORY_STATION, credit: cogs },
        ],
      });
    }
  }

  async postLpgRefillSale(amount: number, refId: string, cogsKg = 0) {
    await this.postEntry({
      eventType: JournalEventType.LPG_REFILL_SALE,
      description: `LPG refill sale ${refId}`,
      referenceType: 'Sale',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.CASH, debit: amount },
        { account: GL_ACCOUNTS.REVENUE_LPG, credit: amount },
      ],
    });

    const cogs = round2(cogsKg * DEFAULT_LPG_COST_PER_KG);
    if (cogs > 0) {
      await this.postEntry({
        eventType: JournalEventType.LPG_COGS,
        description: `LPG COGS ${refId}`,
        referenceType: 'Sale',
        referenceId: refId,
        lines: [
          { account: GL_ACCOUNTS.COGS_LPG, debit: cogs },
          { account: GL_ACCOUNTS.INVENTORY_BULK_LPG, credit: cogs },
        ],
      });
    }
  }

  async postAccessoryGrn(amount: number, refId: string) {
    return this.postEntry({
      eventType: JournalEventType.ACCESSORY_GRN,
      description: `Accessory GRN ${refId}`,
      referenceType: 'PurchaseOrder',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.INVENTORY_CENTRAL, debit: amount },
        { account: GL_ACCOUNTS.ACCOUNTS_PAYABLE, credit: amount },
      ],
    });
  }

  async postConsignmentTransfer(amount: number, refId: string) {
    return this.postEntry({
      eventType: JournalEventType.ACCESSORY_CONSIGNMENT,
      description: `Consignment transfer ${refId}`,
      referenceType: 'Transfer',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.INVENTORY_CONSIGNMENT, debit: amount },
        { account: GL_ACCOUNTS.INVENTORY_CENTRAL, credit: amount },
      ],
    });
  }

  findEntries(limit = 50) {
    return this.entriesRepo.find({
      order: { postedAt: 'DESC' },
      take: limit,
      relations: { lines: true },
    });
  }

  async postStationExpense(amount: number, category: string, refId: string) {
    return this.postEntry({
      eventType: JournalEventType.STATION_EXPENSE,
      description: `Station expense: ${category}`,
      referenceType: 'Expense',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.EXPENSE_STATION, debit: amount },
        { account: GL_ACCOUNTS.PETTY_CASH, credit: amount },
      ],
    });
  }

  async postRequisitionPayment(amount: number, category: string, refId: string) {
    return this.postEntry({
      eventType: JournalEventType.REQUISITION_PAYMENT,
      description: `Requisition payment: ${category}`,
      referenceType: 'Requisition',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.EXPENSE_STATION, debit: amount },
        { account: GL_ACCOUNTS.ACCOUNTS_PAYABLE, credit: amount },
      ],
    });
  }

  async trialBalance() {
    const entries = await this.entriesRepo.find({ relations: { lines: true } });
    const accounts: Record<
      string,
      { code: string; name: string; debit: number; credit: number }
    > = {};

    for (const entry of entries) {
      for (const line of entry.lines ?? []) {
        if (!accounts[line.accountCode]) {
          accounts[line.accountCode] = {
            code: line.accountCode,
            name: line.accountName,
            debit: 0,
            credit: 0,
          };
        }
        accounts[line.accountCode].debit += Number(line.debitAmount);
        accounts[line.accountCode].credit += Number(line.creditAmount);
      }
    }

    return Object.values(accounts)
      .map((a) => ({
        ...a,
        debit: round2(a.debit),
        credit: round2(a.credit),
        balance: round2(a.debit - a.credit),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  async budgetVsActual(year: number, month: number) {
    const budgets = await this.budgetRepo.find({
      where: { fiscalYear: year, fiscalMonth: month },
    });
    const entries = await this.entriesRepo.find({
      where: {},
      relations: { lines: true },
      order: { postedAt: 'DESC' },
      take: 500,
    });

    const actualByAccount: Record<string, number> = {};
    for (const entry of entries) {
      const d = new Date(entry.postedAt);
      if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
      for (const line of entry.lines ?? []) {
        actualByAccount[line.accountCode] =
          (actualByAccount[line.accountCode] ?? 0) +
          Number(line.debitAmount) -
          Number(line.creditAmount);
      }
    }

    return budgets.map((b) => ({
      category: b.category,
      stream: b.commercialStream,
      budget: round2(Number(b.budgetAmount)),
      actual: round2(actualByAccount['4200'] ?? actualByAccount['4100'] ?? 0),
      variance: round2(
        Number(b.budgetAmount) -
          (actualByAccount['4200'] ?? actualByAccount['4100'] ?? 0),
      ),
    }));
  }
}
