import { JournalEventType } from '../common/enums';
import {
  DEFAULT_LPG_COST_PER_KG,
  FinanceService,
  GL_ACCOUNTS,
} from './finance.service';

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
  };
  const linesRepo = { create: jest.fn((l) => l) };
  const budgetRepo = {};

  const service = new FinanceService(
    entriesRepo as never,
    linesRepo as never,
    budgetRepo as never,
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
});
