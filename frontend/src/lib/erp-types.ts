export interface ExecutiveReport {
  charterPhase: number;
  commercialStreams: Record<string, { revenue: number; kg: number; count: number }>;
  salesByChannel: Record<string, number>;
  grossMarginPerKg: number;
  totalRevenueMonth: number;
  totalKgMonth: number;
  franchiseOutlets: number;
  ownedStations: number;
  paycSummary: {
    meters: number;
    deferredRevenue: number;
    dailyBurnKg: number;
    alerts?: number;
  };
  cmmsSummary?: { openWorkOrders: number };
  projectsSummary?: {
    active: number;
    totalBudget: number;
    totalSpent: number;
  };
  budgetVsActual: Array<{
    category: string;
    stream: string | null;
    budget: number;
    actual: number;
    variance: number;
  }>;
  moduleStatus: Array<{
    module: string;
    status: string;
    phase: number;
  }>;
}

export interface AccessoryStockRow {
  id: string;
  quantity: number;
  reorderLevel: number;
  ownership: string;
  product: { id: string; sku: string; name: string; unitPrice: string; barcode?: string };
  station: { code: string; name: string };
}

export interface ProductBundle {
  id: string;
  sku: string;
  name: string;
  bundlePrice: string;
  description?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: string;
  supplier: {
    name: string;
    customerId?: string | null;
    customer?: { customerCode: string; fullName: string } | null;
  };
  destinationStation?: { code: string; name: string } | null;
  lines: Array<{ itemDescription: string; quantity: number; landedUnitCost: string }>;
  documents?: ProcurementDocumentRow[];
}

export interface SupplierRow {
  id: string;
  code: string;
  name: string;
  customerId?: string | null;
  customer?: { customerCode: string; fullName: string } | null;
}

export interface ProcurementDocumentRow {
  id: string;
  documentType: string;
  documentNumber: string;
  issuedAt: string;
  payload: string;
}

export interface CustomerRow {
  id: string;
  customerCode: string;
  fullName: string;
  type: string;
  phone?: string;
  creditLimit: string;
  outstandingBalance: string;
  isSuspended: boolean;
}

export interface PaycDashboard {
  totalMeters: number;
  activeMeters: number;
  offlineMeters: number;
  lowCreditMeters: number;
  totalDeferredRevenue: number;
  totalCreditKg: number;
  estimatedDailyRevenue: number;
  dailyBurnKg: number;
  meters: Array<{
    id: string;
    meterSerial: string;
    status: string;
    creditBalanceKg: string;
    deferredRevenue: string;
    dailyBurnKg: string;
    location?: string;
    customer?: { fullName: string };
  }>;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  type: string;
  status: string;
  title: string;
  dueDate?: string;
  station?: { code: string };
  cylinder?: { serialNumber: string };
  hydroTestCertificateRef?: string;
  estimatedCost?: string;
}

export interface AssetRow {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  status: string;
  station?: { code: string };
  nextServiceDate?: string;
}

export interface CapitalProjectPortfolio {
  totalProjects: number;
  active: number;
  totalBudget: number;
  totalSpent: number;
  projects: Array<{
    id: string;
    projectCode: string;
    name: string;
    type: string;
    status: string;
    approvedBudget: number;
    spentToDate: number;
    utilizationPercent: number;
    grantReference?: string;
    station?: string;
  }>;
}

export interface CapitalProjectDetail {
  id: string;
  projectCode: string;
  name: string;
  type: string;
  status: string;
  approvedBudget: string;
  spentToDate: string;
  grantReference?: string;
  currency: string;
  startDate?: string;
  targetEndDate?: string;
  station?: { id: string; code: string; name: string } | null;
  milestones: Array<{
    id: string;
    name: string;
    dueDate?: string;
    isCompleted: boolean;
    budgetAllocation: string;
  }>;
  expenditures: Array<{
    id: string;
    description: string;
    amount: string;
    expenseDate: string;
    vendorName?: string;
    isCwip: boolean;
  }>;
}

export interface FranchiseAgreementRow {
  id: string;
  agreementCode: string;
  franchiseName: string;
  royaltyPercent: string;
  agentCommissionPercent: string;
  station?: { code: string };
}

export interface FranchiseSettlementRow {
  id: string;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  totalSales: string;
  royaltyDue: string;
  status: string;
}

export interface AgentCommissionRow {
  id: string;
  agentId: string;
  saleAmount: string;
  commissionPercent: string;
  commissionAmount: string;
  status: string;
  agent?: { fullName: string };
}

export interface StationProfitRow {
  code: string;
  name: string;
  isFranchise: boolean;
  revenue: number;
  kgSold: number;
  estimatedCogs: number;
  grossProfit: number;
  transactions: number;
  currentStockKg: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface CashFlowForecast {
  monthToDateRevenue: number;
  dailyAverageRevenue: number;
  projectedMonthEnd: number;
  paycDailyBurnRevenue: number;
  deferredPaycLiability: number;
  capexCommitted: number;
  capexRemaining: number;
}

export interface StaffRoleOption {
  value: import('./types').UserRole;
  label: string;
  description: string;
  requiresStation: boolean;
}

export interface StaffUserRow {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: import('./types').UserRole;
  stationId: string | null;
  station: {
    id: string;
    code: string;
    name: string;
    district: string;
  } | null;
  isActive: boolean;
  canOverridePrice: boolean;
  discountLimitPercent: number;
  createdAt: string;
  updatedAt: string;
}
