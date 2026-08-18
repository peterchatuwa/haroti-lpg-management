import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoriesModule } from '../accessories/accessories.module';
import { AuditLog } from '../audit/audit-log.entity';
import { AuditService } from '../audit/audit.service';
import { CylindersModule } from '../cylinders/cylinders.module';
import { CylindersService } from '../cylinders/cylinders.service';
import { CustomersModule } from '../customers/customers.module';
import { FinanceModule } from '../finance/finance.module';
import { FranchiseModule } from '../franchise/franchise.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PaychanguModule } from '../paychangu/paychangu.module';
import { PriceList } from '../pricing/price-list.entity';
import { ShiftsModule } from '../shifts/shifts.module';
import { StationsModule } from '../stations/stations.module';
import { User } from '../users/user.entity';
import { SaleItem } from './sale-item.entity';
import { SalePayment } from './sale-payment.entity';
import { Sale } from './sale.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, SalePayment, PriceList, AuditLog, User]),
    InventoryModule,
    StationsModule,
    ShiftsModule,
    AccessoriesModule,
    FinanceModule,
    CustomersModule,
    CylindersModule,
    FranchiseModule,
    NotificationsModule,
    LoyaltyModule,
    forwardRef(() => PaychanguModule),
  ],
  controllers: [SalesController],
  providers: [SalesService, AuditService],
  exports: [SalesService],
})
export class SalesModule {}
