import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaycModule } from '../payc/payc.module';
import { PaychanguController } from './paychangu.controller';
import { PaychanguService } from './paychangu.service';
import { PaychanguTransaction } from './paychangu-transaction.entity';
import { PaychanguWebhook } from './paychangu-webhook.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaychanguTransaction, PaychanguWebhook]),
    PaycModule,
  ],
  controllers: [PaychanguController],
  providers: [PaychanguService],
  exports: [PaychanguService],
})
export class PaychanguModule {}
