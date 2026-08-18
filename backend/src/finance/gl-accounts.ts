export type AccountClass =
  'ASSET' | 'LIABILITY' | 'REVENUE' | 'COGS' | 'EXPENSE';

/** Classify GL account code for financial statements. */
export function classifyAccount(code: string): AccountClass {
  if (code.startsWith('1')) return 'ASSET';
  if (code.startsWith('2')) return 'LIABILITY';
  if (code.startsWith('4')) return 'REVENUE';
  if (code.startsWith('5')) return 'COGS';
  if (code.startsWith('6')) return 'EXPENSE';
  return 'ASSET';
}

/** Normal balance for statement presentation (positive = natural direction). */
export function accountBalance(
  accountClass: AccountClass,
  debit: number,
  credit: number,
): number {
  if (accountClass === 'LIABILITY' || accountClass === 'REVENUE') {
    return credit - debit;
  }
  return debit - credit;
}

/** GL account codes aligned to Charter §4 accounting matrix. */
export const GL_ACCOUNTS = {
  INVENTORY_CENTRAL: {
    code: '1200',
    name: 'Inventory: Accessories (Central Hub)',
  },
  INVENTORY_STATION: { code: '1210', name: 'Inventory: Station Accessories' },
  INVENTORY_CONSIGNMENT: {
    code: '1220',
    name: 'Inventory: Franchise Consignment',
  },
  INVENTORY_BULK_LPG: { code: '1250', name: 'Inventory: Bulk LPG' },
  ACCOUNTS_PAYABLE: { code: '2100', name: 'Accounts Payable' },
  CASH: { code: '1100', name: 'Cash-in-Hand / Mobile Money Clearing' },
  AR_FRANCHISE: { code: '1300', name: 'Accounts Receivable: Franchise' },
  AR_CUSTOMER: { code: '1310', name: 'Accounts Receivable: Customers' },
  REVENUE_ACCESSORY: { code: '4100', name: 'Revenue: Accessory Sales' },
  REVENUE_BUNDLE: { code: '4110', name: 'Revenue: Accessory Bundles' },
  REVENUE_LPG: { code: '4200', name: 'Revenue: LPG Refill Sales' },
  REVENUE_PAYC: { code: '4300', name: 'Revenue: PAYC Burn' },
  REVENUE_FRANCHISE: { code: '4350', name: 'Revenue: Franchise Royalty' },
  COGS_LPG: { code: '5200', name: 'COGS: LPG Refill Sales' },
  COGS_ACCESSORY: { code: '5100', name: 'COGS: Accessories' },
  DEFERRED_PAYC: { code: '2300', name: 'Deferred Revenue: PAYC Credit' },
  CWIP: { code: '1400', name: 'Capital Work-in-Progress (CWIP)' },
  COMMISSION_PAYABLE: { code: '2200', name: 'Commission Payable: Agents' },
  EXPENSE_STATION: { code: '6100', name: 'Station Operating Expenses' },
  PETTY_CASH: { code: '1110', name: 'Petty Cash' },
} as const;

export const DEFAULT_LPG_COST_PER_KG = 1200;
