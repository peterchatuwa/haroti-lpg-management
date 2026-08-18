import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Currency,
  JournalEventType,
  JournalPostingStatus,
} from '../common/enums';
import { BudgetLine } from './budget-line.entity';
import { FiscalPeriodService } from './fiscal-period.service';
import {
  accountBalance,
  classifyAccount,
  GL_ACCOUNTS,
  DEFAULT_LPG_COST_PER_KG,
} from './gl-accounts';
import { JournalEntry } from './journal-entry.entity';
import { JournalLine } from './journal-line.entity';
import { asDecimal, round2 } from '../common/decimal';

export { GL_ACCOUNTS, DEFAULT_LPG_COST_PER_KG };

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(JournalEntry)
    private readonly entriesRepo: Repository<JournalEntry>,
    @InjectRepository(JournalLine)
    private readonly linesRepo: Repository<JournalLine>,
    @InjectRepository(BudgetLine)
    private readonly budgetRepo: Repository<BudgetLine>,
    private readonly fiscalPeriodService: FiscalPeriodService,
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
    await this.fiscalPeriodService.assertOpenForPosting();

    const entry = this.entriesRepo.create({
      entryNumber: this.entryNumber(params.eventType),
      eventType: params.eventType,
      postingStatus: JournalPostingStatus.POSTED,
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

  async reverseEntry(
    originalId: string,
    reason: string,
    userId?: string,
  ): Promise<JournalEntry> {
    const original = await this.entriesRepo.findOne({
      where: { id: originalId },
      relations: { lines: true },
    });
    if (!original) throw new BadRequestException('Journal entry not found');
    if (original.postingStatus === JournalPostingStatus.REVERSED) {
      throw new BadRequestException('Entry already reversed');
    }
    if (original.reversedByEntryId) {
      throw new BadRequestException('Entry already has a reversal');
    }

    await this.fiscalPeriodService.assertOpenForPosting();

    const reversal = this.entriesRepo.create({
      entryNumber: this.entryNumber(JournalEventType.SALE_REVERSAL),
      eventType: JournalEventType.SALE_REVERSAL,
      postingStatus: JournalPostingStatus.POSTED,
      description: `Reversal of ${original.entryNumber}: ${reason}`,
      referenceType: original.referenceType,
      referenceId: original.referenceId,
      reversesEntryId: original.id,
      reversalReason: reason,
      currency: original.currency,
      lines: (original.lines ?? []).map((l) =>
        this.linesRepo.create({
          accountCode: l.accountCode,
          accountName: l.accountName,
          debitAmount: l.creditAmount,
          creditAmount: l.debitAmount,
        }),
      ),
    });
    const saved = await this.entriesRepo.save(reversal);
    original.postingStatus = JournalPostingStatus.REVERSED;
    original.reversedByEntryId = saved.id;
    await this.entriesRepo.save(original);
    return saved;
  }

  async reverseAllForReference(
    referenceType: string,
    referenceId: string,
    reason: string,
  ) {
    const entries = await this.entriesRepo.find({
      where: {
        referenceType,
        referenceId,
        postingStatus: JournalPostingStatus.POSTED,
      },
    });
    const reversed: JournalEntry[] = [];
    for (const entry of entries) {
      reversed.push(await this.reverseEntry(entry.id, reason));
    }
    return reversed;
  }

  async postBundleSale(amount: number, refId: string) {
    return this.postEntry({
      eventType: JournalEventType.BUNDLE_SALE,
      description: `Bundle sale ${refId}`,
      referenceType: 'Sale',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.CASH, debit: amount },
        { account: GL_ACCOUNTS.REVENUE_BUNDLE, credit: amount },
      ],
    });
  }

  async postAgentCommission(amount: number, refId: string) {
    return this.postEntry({
      eventType: JournalEventType.AGENT_COMMISSION,
      description: `Agent commission ${refId}`,
      referenceType: 'Sale',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.COGS_ACCESSORY, debit: amount },
        { account: GL_ACCOUNTS.COMMISSION_PAYABLE, credit: amount },
      ],
    });
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

  async postLpgRefillSale(
    amount: number,
    refId: string,
    cogsKg = 0,
    costPerKg?: number,
  ) {
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

    const unitCost = costPerKg ?? DEFAULT_LPG_COST_PER_KG;
    const cogs = round2(cogsKg * unitCost);
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

  async postCreditSale(
    amount: number,
    refId: string,
    cogsKg = 0,
    costPerKg?: number,
  ) {
    await this.postEntry({
      eventType: JournalEventType.CUSTOMER_CREDIT_SALE,
      description: `Credit sale ${refId}`,
      referenceType: 'Sale',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.AR_CUSTOMER, debit: amount },
        { account: GL_ACCOUNTS.REVENUE_LPG, credit: amount },
      ],
    });

    const unitCost = costPerKg ?? DEFAULT_LPG_COST_PER_KG;
    const cogs = round2(cogsKg * unitCost);
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

  async postCustomerPayment(amount: number, refId: string) {
    return this.postEntry({
      eventType: JournalEventType.CUSTOMER_PAYMENT,
      description: `Customer payment ${refId}`,
      referenceType: 'CustomerPayment',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.CASH, debit: amount },
        { account: GL_ACCOUNTS.AR_CUSTOMER, credit: amount },
      ],
    });
  }

  async postSupplierPayment(amount: number, refId: string) {
    const existing = await this.entriesRepo.findOne({
      where: {
        referenceType: 'PurchaseOrder',
        referenceId: refId,
        eventType: JournalEventType.SUPPLIER_PAYMENT,
      },
    });
    if (existing) return existing;

    return this.postEntry({
      eventType: JournalEventType.SUPPLIER_PAYMENT,
      description: `Supplier payment ${refId}`,
      referenceType: 'PurchaseOrder',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.ACCOUNTS_PAYABLE, debit: amount },
        { account: GL_ACCOUNTS.CASH, credit: amount },
      ],
    });
  }

  async postFranchiseSettlement(amount: number, refId: string) {
    const existing = await this.entriesRepo.findOne({
      where: {
        referenceType: 'FranchiseSettlement',
        referenceId: refId,
        eventType: JournalEventType.FRANCHISE_SETTLEMENT,
      },
    });
    if (existing) return existing;

    return this.postEntry({
      eventType: JournalEventType.FRANCHISE_SETTLEMENT,
      description: `Franchise royalty ${refId}`,
      referenceType: 'FranchiseSettlement',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.AR_FRANCHISE, debit: amount },
        { account: GL_ACCOUNTS.REVENUE_FRANCHISE, credit: amount },
      ],
    });
  }

  async postFranchiseConsignmentSettlement(amount: number, refId: string) {
    const existing = await this.entriesRepo.findOne({
      where: {
        referenceType: 'FranchiseSettlement',
        referenceId: refId,
        eventType: JournalEventType.FRANCHISE_CONSIGNMENT,
      },
    });
    if (existing) return existing;

    return this.postEntry({
      eventType: JournalEventType.FRANCHISE_CONSIGNMENT,
      description: `Franchise consignment due ${refId}`,
      referenceType: 'FranchiseSettlement',
      referenceId: refId,
      lines: [
        { account: GL_ACCOUNTS.AR_FRANCHISE, debit: amount },
        { account: GL_ACCOUNTS.INVENTORY_CONSIGNMENT, credit: amount },
      ],
    });
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

  async postRequisitionPayment(
    amount: number,
    category: string,
    refId: string,
  ) {
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

  async trialBalance(from?: string, to?: string) {
    const rows = await this.aggregateAccountBalances(from, to);
    return rows
      .map((a) => ({
        code: a.code,
        name: a.name,
        debit: round2(a.debit),
        credit: round2(a.credit),
        balance: round2(a.debit - a.credit),
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  private parseDateRange(from?: string, to?: string) {
    const start = from ? new Date(from) : new Date(0);
    start.setHours(0, 0, 0, 0);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async aggregateAccountBalances(from?: string, to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    const entries = await this.entriesRepo.find({ relations: { lines: true } });
    const accounts: Record<
      string,
      { code: string; name: string; debit: number; credit: number }
    > = {};

    for (const entry of entries) {
      if (entry.postingStatus === JournalPostingStatus.REVERSED) continue;
      const posted = new Date(entry.postedAt);
      if (posted < start || posted > end) continue;
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

    return Object.values(accounts);
  }

  async incomeStatement(from?: string, to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    const rows = await this.aggregateAccountBalances(from, to);

    const revenue: Array<{ code: string; name: string; amount: number }> = [];
    const cogs: Array<{ code: string; name: string; amount: number }> = [];
    const expenses: Array<{ code: string; name: string; amount: number }> = [];

    for (const row of rows) {
      const cls = classifyAccount(row.code);
      const amount = round2(accountBalance(cls, row.debit, row.credit));
      if (amount === 0) continue;
      const line = { code: row.code, name: row.name, amount };
      if (cls === 'REVENUE') revenue.push(line);
      else if (cls === 'COGS') cogs.push(line);
      else if (cls === 'EXPENSE') expenses.push(line);
    }

    const totalRevenue = round2(revenue.reduce((s, l) => s + l.amount, 0));
    const totalCogs = round2(cogs.reduce((s, l) => s + l.amount, 0));
    const totalExpenses = round2(expenses.reduce((s, l) => s + l.amount, 0));
    const grossProfit = round2(totalRevenue - totalCogs);
    const netIncome = round2(grossProfit - totalExpenses);

    return {
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
      revenue,
      cogs,
      expenses,
      totalRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netIncome,
    };
  }

  async balanceSheet(asOf?: string) {
    const end = asOf ?? new Date().toISOString().slice(0, 10);
    const rows = await this.aggregateAccountBalances(undefined, end);

    const assets: Array<{ code: string; name: string; amount: number }> = [];
    const liabilities: Array<{ code: string; name: string; amount: number }> =
      [];

    for (const row of rows) {
      const cls = classifyAccount(row.code);
      const amount = round2(accountBalance(cls, row.debit, row.credit));
      if (amount === 0) continue;
      const line = { code: row.code, name: row.name, amount };
      if (cls === 'ASSET') assets.push(line);
      else if (cls === 'LIABILITY') liabilities.push(line);
    }

    const totalAssets = round2(assets.reduce((s, l) => s + l.amount, 0));
    const totalLiabilities = round2(
      liabilities.reduce((s, l) => s + l.amount, 0),
    );

    const pnl = await this.incomeStatement(undefined, end);
    const retainedEarnings = pnl.netIncome;
    const totalEquity = retainedEarnings;
    const totalLiabilitiesAndEquity = round2(totalLiabilities + totalEquity);

    return {
      asOf: end,
      assets,
      liabilities,
      equity: [
        {
          code: 'RE',
          name: 'Retained earnings (cumulative net income)',
          amount: retainedEarnings,
        },
      ],
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity,
      balanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.02,
    };
  }

  async cashFlowStatement(from?: string, to?: string) {
    const { start, end } = this.parseDateRange(from, to);
    const entries = await this.entriesRepo.find({ relations: { lines: true } });
    const cashCodes = new Set(['1100', '1110']);

    const operating: Array<{ label: string; amount: number }> = [];
    const investing: Array<{ label: string; amount: number }> = [];
    const financing: Array<{ label: string; amount: number }> = [];
    const buckets = {
      operating: new Map<string, number>(),
      investing: new Map<string, number>(),
      financing: new Map<string, number>(),
    };

    for (const entry of entries) {
      if (entry.postingStatus === JournalPostingStatus.REVERSED) continue;
      const posted = new Date(entry.postedAt);
      if (posted < start || posted > end) continue;

      for (const line of entry.lines ?? []) {
        if (!cashCodes.has(line.accountCode)) continue;
        const change = round2(
          Number(line.debitAmount) - Number(line.creditAmount),
        );
        if (change === 0) continue;

        const bucket = this.cashFlowBucket(entry.eventType);
        const label = entry.eventType.replaceAll('_', ' ');
        buckets[bucket].set(
          label,
          round2((buckets[bucket].get(label) ?? 0) + change),
        );
      }
    }

    for (const [label, amount] of buckets.operating) {
      operating.push({ label, amount });
    }
    for (const [label, amount] of buckets.investing) {
      investing.push({ label, amount });
    }
    for (const [label, amount] of buckets.financing) {
      financing.push({ label, amount });
    }

    const netOperating = round2(operating.reduce((s, l) => s + l.amount, 0));
    const netInvesting = round2(investing.reduce((s, l) => s + l.amount, 0));
    const netFinancing = round2(financing.reduce((s, l) => s + l.amount, 0));
    const netChange = round2(netOperating + netInvesting + netFinancing);

    return {
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
      operating,
      investing,
      financing,
      netOperating,
      netInvesting,
      netFinancing,
      netChange,
    };
  }

  private cashFlowBucket(
    eventType: JournalEventType,
  ): 'operating' | 'investing' | 'financing' {
    switch (eventType) {
      case JournalEventType.CAPITAL_EXPENDITURE:
        return 'investing';
      case JournalEventType.FRANCHISE_SETTLEMENT:
      case JournalEventType.FRANCHISE_CONSIGNMENT:
        return 'financing';
      default:
        return 'operating';
    }
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
