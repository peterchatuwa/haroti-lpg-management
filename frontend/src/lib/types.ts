export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'DIRECTOR'
  | 'OPERATIONS_MANAGER'
  | 'FINANCE_MANAGER'
  | 'STATION_MANAGER'
  | 'ATTENDANT'
  | 'STOREKEEPER'
  | 'SAFETY_OFFICER'
  | 'AUDITOR';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  stationId?: string | null;
  station?: {
    id: string;
    code: string;
    name: string;
    district: string;
    currentStockKg?: number;
  } | null;
  canOverridePrice: boolean;
  discountLimitPercent: number;
}

export interface Station {
  id: string;
  code: string;
  name: string;
  district: string;
  address?: string;
  managerName?: string;
  tankCapacityKg: string | number;
  currentStockKg: string | number;
  status: string;
  lastSyncedAt?: string;
}

export interface DashboardOverview {
  totalLpgStockKg: number;
  totalCapacityKg: number;
  utilizationPercent: number;
  salesToday: number;
  kgSoldToday: number;
  transactionsToday: number;
  salesMonth: number;
  kgSoldMonth: number;
  expensesMonth: number;
  outstandingCustomerBalances: number;
  cylindersWithCustomers: number;
  damagedCylinders: number;
  openShifts: number;
  unconfirmedTransfers: number;
  topStation: StationPerf | null;
  lowestStation: StationPerf | null;
  stations: StationPerf[];
}

export interface StationPerf {
  id: string;
  code: string;
  name: string;
  district: string;
  currentStockKg: number;
  tankCapacityKg: number;
  status: string;
  lastSyncedAt?: string;
  salesToday: number;
  kgToday: number;
  salesMonth: number;
  kgMonth: number;
  transactionsToday: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitPrice: string;
  pricePerKg?: string;
  nominalKg?: string;
}

export interface Shift {
  id: string;
  stationId: string;
  status: string;
  openedAt: string;
  openingCashFloat: string;
  openingLpgStockKg: string;
  cashVariance?: string;
  stockVarianceKg?: string;
}
