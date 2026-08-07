import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cylinder } from '../cylinders/cylinder.entity';
import { RefillRequest } from '../customer-portal/refill-request.entity';
import { FinanceModule } from '../finance/finance.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationDelivery } from '../notifications/notification-delivery.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaycMeter } from '../payc/payc-meter.entity';
import { Sale } from '../sales/sale.entity';
import { CustomerPayment } from './customer-payment.entity';
import { Customer } from './customer.entity';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Sale,
      CustomerPayment,
      Cylinder,
      PaycMeter,
      RefillRequest,
      NotificationDelivery,
    ]),
    FinanceModule,
    NotificationsModule,
    LoyaltyModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
