import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { LoyaltyAccount } from './loyalty-account.entity';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyTransaction } from './loyalty-transaction.entity';
import { LoyaltyService } from './loyalty.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoyaltyAccount, LoyaltyTransaction, Customer]),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
