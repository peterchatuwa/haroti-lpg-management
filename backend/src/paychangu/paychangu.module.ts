import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaycModule } from '../payc/payc.module';
import { SalesModule } from '../sales/sales.module';
import { PaychanguController } from './paychangu.controller';
import { PaychanguService } from './paychangu.service';
import { PaychanguTransaction } from './paychangu-transaction.entity';
import { PaychanguWebhook } from './paychangu-webhook.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaychanguTransaction, PaychanguWebhook]),
    PaycModule,
    forwardRef(() => SalesModule),
  ],
  controllers: [PaychanguController],
  providers: [PaychanguService],
  exports: [PaychanguService],
})
export class PaychanguModule {}
