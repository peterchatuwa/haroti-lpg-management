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
import { ComplianceItem } from '../safety/compliance-item.entity';
import { SafetyIncident } from '../safety/safety-incident.entity';
import { CylinderStocktakeLine } from '../cylinders/cylinder-stocktake-line.entity';
import { CylinderStocktake } from '../cylinders/cylinder-stocktake.entity';
import { DeliveryAllocation } from '../deliveries/delivery-allocation.entity';
import { MaintenancePlan } from '../maintenance/maintenance-plan.entity';
import { BankAccount } from '../banking/bank-account.entity';
import { BankStatementLine } from '../banking/bank-statement-line.entity';
import { FiscalPeriod } from '../finance/fiscal-period.entity';
import { PostingRule } from '../finance/posting-rule.entity';
import { JobRun } from '../jobs/job-run.entity';
import { LossCaseAction } from '../tanks/loss-case-action.entity';
import { LossCase } from '../tanks/loss-case.entity';
import { CylinderMovement } from '../cylinders/cylinder-movement.entity';
import { MobileMoneyLine } from '../banking/mobile-money-line.entity';
import { TransferItem } from '../transfers/transfer-item.entity';
import { Transfer } from '../transfers/transfer.entity';
import { SupplierInvoice } from '../procurement/supplier-invoice.entity';
import { Attachment } from '../attachments/attachment.entity';
import { Target } from '../targets/target.entity';
import { Permission } from '../permissions/permission.entity';
import { RolePermission } from '../permissions/role-permission.entity';
import { User } from '../users/user.entity';
import { WorkflowDefinition } from '../workflows/workflow-definition.entity';
import { WorkflowStep } from '../workflows/workflow-step.entity';
import { ApprovalTask } from '../workflows/approval-task.entity';
import { Notification } from '../notifications/notification.entity';
import { NotificationDelivery } from '../notifications/notification-delivery.entity';
import { NotificationPreference } from '../notifications/notification-preference.entity';
import { IoTDevice } from '../iot/iot-device.entity';
import { TelemetryReading } from '../iot/telemetry-reading.entity';
import { LoyaltyAccount } from '../loyalty/loyalty-account.entity';
import { LoyaltyTransaction } from '../loyalty/loyalty-transaction.entity';
import { CustomerOtpChallenge } from '../customer-portal/customer-otp-challenge.entity';
import { RefillRequest } from '../customer-portal/refill-request.entity';

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
  Target,
  BankAccount,
  BankStatementLine,
  SupplierInvoice,
  Attachment,
  CylinderStocktake,
  CylinderStocktakeLine,
  SafetyIncident,
  ComplianceItem,
  MaintenancePlan,
  DeliveryAllocation,
  WorkflowDefinition,
  WorkflowStep,
  ApprovalTask,
  Notification,
  NotificationDelivery,
  NotificationPreference,
  IoTDevice,
  TelemetryReading,
  LoyaltyAccount,
  LoyaltyTransaction,
  CustomerOtpChallenge,
  RefillRequest,
  Permission,
  RolePermission,
];
