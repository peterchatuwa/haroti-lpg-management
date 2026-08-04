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
  supplier: { name: string };
  destinationStation?: { code: string; name: string } | null;
  lines: Array<{ itemDescription: string; quantity: number; landedUnitCost: string }>;
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

export interface WorkOrder {
  id: string;
  woNumber: string;
  type: string;
  status: string;
  title: string;
  dueDate?: string;
  station?: { code: string };
  cylinder?: { serialNumber: string };
}
