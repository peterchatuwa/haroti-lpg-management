import { AccessoryStock } from '../accessories/accessory-stock.entity';
import { ChannelPrice } from '../accessories/channel-price.entity';
import { ProductBundleItem } from '../accessories/product-bundle-item.entity';
import { ProductBundle } from '../accessories/product-bundle.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { CashDeposit } from '../banking/cash-deposit.entity';
import { CustomerPayment } from '../customers/customer-payment.entity';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { Expense } from '../expenses/expense.entity';
import { AgentCommission } from '../franchise/agent-commission.entity';
import { FranchiseAgreement } from '../franchise/franchise-agreement.entity';
import { FranchiseSettlementLine } from '../franchise/franchise-settlement-line.entity';
import { FranchiseSettlement } from '../franchise/franchise-settlement.entity';
import { BudgetLine } from '../finance/budget-line.entity';
import { JournalEntry } from '../finance/journal-entry.entity';
import { JournalLine } from '../finance/journal-line.entity';
import { StockMovement } from '../inventory/stock-movement.entity';
import { Asset } from '../maintenance/asset.entity';
import { MaintenanceWorkOrder } from '../maintenance/work-order.entity';
import { PaycCreditTransaction } from '../payc/payc-credit-transaction.entity';
import { PaycMeter } from '../payc/payc-meter.entity';
import { PaycTelemetry } from '../payc/payc-telemetry.entity';
import { CapitalProject } from '../projects/capital-project.entity';
import { ProjectExpenditure } from '../projects/project-expenditure.entity';
import { ProjectMilestone } from '../projects/project-milestone.entity';
import { PriceList } from '../pricing/price-list.entity';
import { ProcurementDocument } from '../procurement/procurement-document.entity';
import { PurchaseOrderLine } from '../procurement/purchase-order-line.entity';
import { PurchaseOrder } from '../procurement/purchase-order.entity';
import { RequisitionLine } from '../requisitions/requisition-line.entity';
import { Requisition } from '../requisitions/requisition.entity';
import { Product } from '../products/product.entity';
import { SaleItem } from '../sales/sale-item.entity';
import { SalePayment } from '../sales/sale-payment.entity';
import { Sale } from '../sales/sale.entity';
import { Shift } from '../shifts/shift.entity';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { Tank } from '../tanks/tank.entity';
import { TankReading } from '../tanks/tank-reading.entity';
import { FiscalPeriod } from '../finance/fiscal-period.entity';
import { PostingRule } from '../finance/posting-rule.entity';
import { JobRun } from '../jobs/job-run.entity';
import { LossCaseAction } from '../tanks/loss-case-action.entity';
import { LossCase } from '../tanks/loss-case.entity';
import { CylinderMovement } from '../cylinders/cylinder-movement.entity';
import { MobileMoneyLine } from '../banking/mobile-money-line.entity';
import { TransferItem } from '../transfers/transfer-item.entity';
import { Transfer } from '../transfers/transfer.entity';
import { User } from '../users/user.entity';

export const ENTITIES = [
  Station,
  User,
  Customer,
  CustomerPayment,
  Supplier,
  Product,
  StockMovement,
  Delivery,
  Sale,
  SaleItem,
  SalePayment,
  Shift,
  Cylinder,
  Transfer,
  TransferItem,
  Expense,
  CashDeposit,
  PriceList,
  AuditLog,
  AccessoryStock,
  ChannelPrice,
  ProductBundle,
  ProductBundleItem,
  PurchaseOrder,
  PurchaseOrderLine,
  ProcurementDocument,
  JournalEntry,
  JournalLine,
  BudgetLine,
  FiscalPeriod,
  PostingRule,
  PaycMeter,
  PaycTelemetry,
  PaycCreditTransaction,
  MaintenanceWorkOrder,
  Asset,
  CapitalProject,
  ProjectMilestone,
  ProjectExpenditure,
  FranchiseAgreement,
  FranchiseSettlement,
  FranchiseSettlementLine,
  AgentCommission,
  Tank,
  TankReading,
  LossCase,
  LossCaseAction,
  CylinderMovement,
  MobileMoneyLine,
  Requisition,
  RequisitionLine,
  JobRun,
];
