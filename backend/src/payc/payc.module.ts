import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { FinanceModule } from '../finance/finance.module';
import { Notification } from '../notifications/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SafetyModule } from '../safety/safety.module';
import { User } from '../users/user.entity';
import { PaycCommand } from './payc-command.entity';
import { PaycController } from './payc.controller';
import { PaycCreditTransaction } from './payc-credit-transaction.entity';
import { PaycMeter } from './payc-meter.entity';
import { PaycService } from './payc.service';
import { PaycTelemetry } from './payc-telemetry.entity';
import { ZhongyiMeterClient } from './zhongyi-meter.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaycMeter,
      PaycTelemetry,
      PaycCreditTransaction,
      PaycCommand,
      Customer,
      User,
      Notification,
    ]),
    FinanceModule,
    NotificationsModule,
    SafetyModule,
  ],
  controllers: [PaycController],
  providers: [PaycService, ZhongyiMeterClient],
  exports: [PaycService],
})
export class PaycModule {}
