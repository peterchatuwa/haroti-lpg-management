import { JournalEventType } from '../common/enums';
import { FinanceService } from './finance.service';
import { GL_ACCOUNTS } from './gl-accounts';

describe('FinanceService LPG COGS (AC-11)', () => {
  const savedEntries: Array<{ eventType: JournalEventType; lines: unknown[] }> =
    [];

  const entriesRepo = {
    create: jest.fn((e) => e),
    save: jest.fn(async (e) => {
      savedEntries.push({
        eventType: e.eventType,
        lines: e.lines,
      });
      return { ...e, id: `je-${savedEntries.length}` };
    }),
    findOne: jest.fn(async () => null),
  };
  const linesRepo = { create: jest.fn((l) => l) };
  const budgetRepo = {};
  const fiscalPeriodService = {
    assertOpenForPosting: jest.fn(async () => undefined),
  };

  const service = new FinanceService(
    entriesRepo as never,
    linesRepo as never,
    budgetRepo as never,
    fiscalPeriodService as never,
  );

  beforeEach(() => {
    savedEntries.length = 0;
    jest.clearAllMocks();
  });

  it('posts revenue and COGS journals for LPG refill sales', async () => {
    await service.postLpgRefillSale(22200, 'sale-1', 12);

    expect(savedEntries).toHaveLength(2);
    expect(savedEntries[0].eventType).toBe(JournalEventType.LPG_REFILL_SALE);
    expect(savedEntries[1].eventType).toBe(JournalEventType.LPG_COGS);
    expect(savedEntries[1].lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.COGS_LPG.code,
          debitAmount: '14400.00',
        }),
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.INVENTORY_BULK_LPG.code,
          creditAmount: '14400.00',
        }),
      ]),
    );
  });

  it('uses station WAC for COGS when costPerKg provided', async () => {
    await service.postLpgRefillSale(10000, 'sale-wac', 10, 1500);

    expect(savedEntries[1].lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.COGS_LPG.code,
          debitAmount: '15000.00',
        }),
      ]),
    );
  });

  it('posts credit sale to AR and revenue', async () => {
    await service.postCreditSale(5000, 'sale-credit', 5, 1200);

    expect(savedEntries[0].eventType).toBe(JournalEventType.CUSTOMER_CREDIT_SALE);
    expect(savedEntries[0].lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.AR_CUSTOMER.code,
          debitAmount: '5000.00',
        }),
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.REVENUE_LPG.code,
          creditAmount: '5000.00',
        }),
      ]),
    );
  });

  it('posts customer payment DR cash CR AR', async () => {
    await service.postCustomerPayment(3000, 'pay-1');

    expect(savedEntries).toHaveLength(1);
    expect(savedEntries[0].eventType).toBe(JournalEventType.CUSTOMER_PAYMENT);
    expect(savedEntries[0].lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.CASH.code,
          debitAmount: '3000.00',
        }),
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.AR_CUSTOMER.code,
          creditAmount: '3000.00',
        }),
      ]),
    );
  });

  it('posts franchise consignment DR AR CR consignment inventory', async () => {
    await service.postFranchiseConsignmentSettlement(15000, 'fs-1');

    expect(savedEntries).toHaveLength(1);
    expect(savedEntries[0].eventType).toBe(JournalEventType.FRANCHISE_CONSIGNMENT);
    expect(savedEntries[0].lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.AR_FRANCHISE.code,
          debitAmount: '15000.00',
        }),
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.INVENTORY_CONSIGNMENT.code,
          creditAmount: '15000.00',
        }),
      ]),
    );
  });

  it('posts station expense to GL 6100/1110', async () => {
    await service.postStationExpense(25000, 'Transport', 'exp-1');

    expect(savedEntries).toHaveLength(1);
    expect(savedEntries[0].eventType).toBe(JournalEventType.STATION_EXPENSE);
    expect(savedEntries[0].lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.EXPENSE_STATION.code,
          debitAmount: '25000.00',
        }),
        expect.objectContaining({
          accountCode: GL_ACCOUNTS.PETTY_CASH.code,
          creditAmount: '25000.00',
        }),
      ]),
    );
  });

  it('builds trial balance from journal lines', async () => {
    entriesRepo.find = jest.fn(async () => [
      {
        lines: [
          {
            accountCode: '1100',
            accountName: 'Cash',
            debitAmount: '100.00',
            creditAmount: '0.00',
          },
          {
            accountCode: '4200',
            accountName: 'Revenue',
            debitAmount: '0.00',
            creditAmount: '100.00',
          },
        ],
      },
    ]);

    const tb = await service.trialBalance();
    expect(tb).toHaveLength(2);
    expect(tb.find((a) => a.code === '1100')?.balance).toBe(100);
  });
});
