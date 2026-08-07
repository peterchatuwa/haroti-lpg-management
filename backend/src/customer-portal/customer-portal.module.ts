import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaycModule } from '../payc/payc.module';
import { PriceList } from '../pricing/price-list.entity';
import { Sale } from '../sales/sale.entity';
import { SaleStatus } from '../common/enums';
import { Station } from '../stations/station.entity';
import { CustomerOtpChallenge } from './customer-otp-challenge.entity';
import { CustomerPortalController } from './customer-portal.controller';
import { CustomerPortalService } from './customer-portal.service';
import { RefillRequest } from './refill-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOtpChallenge,
      RefillRequest,
      PriceList,
      Station,
      Sale,
    ]),
    AuthModule,
    CustomersModule,
    PaycModule,
    NotificationsModule,
    LoyaltyModule,
  ],
  controllers: [CustomerPortalController],
  providers: [CustomerPortalService],
  exports: [CustomerPortalService],
})
export class CustomerPortalModule {}
