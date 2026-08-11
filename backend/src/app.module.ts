import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoryStock } from './accessories/accessory-stock.entity';
import { AccessoriesModule } from './accessories/accessories.module';
import { ChannelPrice } from './accessories/channel-price.entity';
import { ProductBundleItem } from './accessories/product-bundle-item.entity';
import { ProductBundle } from './accessories/product-bundle.entity';
import { AuthModule } from './auth/auth.module';
import { StationScopeModule } from './auth/station-scope.module';
import { AuditLog } from './audit/audit-log.entity';
import { CashDeposit } from './banking/cash-deposit.entity';
import { CatalogModule } from './catalog/catalog.module';
import { Customer } from './customers/customer.entity';
import { CustomersModule } from './customers/customers.module';
import { CylindersModule } from './cylinders/cylinders.module';
import { Cylinder } from './cylinders/cylinder.entity';
import { BankingModule } from './banking/banking.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { Delivery } from './deliveries/delivery.entity';
import { Expense } from './expenses/expense.entity';
import { ExpensesModule } from './expenses/expenses.module';
import { BudgetLine } from './finance/budget-line.entity';
import { FinanceModule } from './finance/finance.module';
import { JournalEntry } from './finance/journal-entry.entity';
import { JournalLine } from './finance/journal-line.entity';
import { AgentCommission } from './franchise/agent-commission.entity';
import { FranchiseAgreement } from './franchise/franchise-agreement.entity';
import { FranchiseModule } from './franchise/franchise.module';
import { FranchiseSettlementLine } from './franchise/franchise-settlement-line.entity';
import { FranchiseSettlement } from './franchise/franchise-settlement.entity';
import { ENTITIES } from './database/entities';
import { ImmutableRecordSubscriber } from './database/immutable-record.subscriber';
import { InventoryModule } from './inventory/inventory.module';
import { StockMovement } from './inventory/stock-movement.entity';
import { Asset } from './maintenance/asset.entity';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActionCentreModule } from './action-centre/action-centre.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { TargetsModule } from './targets/targets.module';
import { ExecutiveModule } from './executive/executive.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import { PaycCreditTransaction } from './payc/payc-credit-transaction.entity';
import { PaycMeter } from './payc/payc-meter.entity';
import { PaycTelemetry } from './payc/payc-telemetry.entity';
import { PaycModule } from './payc/payc.module';
import { CapitalProject } from './projects/capital-project.entity';
import { ProjectExpenditure } from './projects/project-expenditure.entity';
import { ProjectMilestone } from './projects/project-milestone.entity';
import { ProjectsModule } from './projects/projects.module';
import { PriceList } from './pricing/price-list.entity';
import { ProcurementModule } from './procurement/procurement.module';
import { PurchaseOrderLine } from './procurement/purchase-order-line.entity';
import { PurchaseOrder } from './procurement/purchase-order.entity';
import { Product } from './products/product.entity';
import { RequisitionsModule } from './requisitions/requisitions.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ReportsModule } from './reports/reports.module';
import { SaleItem } from './sales/sale-item.entity';
import { SalePayment } from './sales/sale-payment.entity';
import { Sale } from './sales/sale.entity';
import { SalesModule } from './sales/sales.module';
import { SafetyModule } from './safety/safety.module';
import { Shift } from './shifts/shift.entity';
import { ShiftsModule } from './shifts/shifts.module';
import { Station } from './stations/station.entity';
import { StationsModule } from './stations/stations.module';
import { Supplier } from './suppliers/supplier.entity';
import { TanksModule } from './tanks/tanks.module';
import { TransferItem } from './transfers/transfer-item.entity';
import { Transfer } from './transfers/transfer.entity';
import { TransfersModule } from './transfers/transfers.module';
import { SeedModule } from './seed/seed.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { IoTModule } from './iot/iot.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';
import { AiModule } from './ai/ai.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get<string>('DATABASE_PORT', '5432')),
        username: config.get<string>('DATABASE_USER', 'haroti'),
        password: config.get<string>('DATABASE_PASSWORD', 'haroti_dev'),
        database: config.get<string>('DATABASE_NAME', 'haroti_lpg'),
        entities: ENTITIES,
        subscribers: [ImmutableRecordSubscriber],
        migrations: [__dirname + '/database/migrations/*.{ts,js}'],
        migrationsRun: config.get('DATABASE_SYNC') !== 'true',
        synchronize: config.get('DATABASE_SYNC') === 'true',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    StationScopeModule,
    AuthModule,
    StationsModule,
    InventoryModule,
    SalesModule,
    ShiftsModule,
    DeliveriesModule,
    TransfersModule,
    ExpensesModule,
    CatalogModule,
    DashboardModule,
    SeedModule,
    AccessoriesModule,
    ProcurementModule,
    FinanceModule,
    PaycModule,
    MaintenanceModule,
    ProjectsModule,
    FranchiseModule,
    ReportsModule,
    CustomersModule,
    TanksModule,
    CylindersModule,
    BankingModule,
    RequisitionsModule,
    SuppliersModule,
    NotificationsModule,
    HealthModule,
    AttachmentsModule,
    TargetsModule,
    ActionCentreModule,
    ExecutiveModule,
    JobsModule,
    SafetyModule,
    WorkflowsModule,
    AnalyticsModule,
    IoTModule,
    LoyaltyModule,
    CustomerPortalModule,
    AiModule,
    SearchModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
