import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoriesModule } from '../accessories/accessories.module';
import { Customer } from '../customers/customer.entity';
import { FinanceModule } from '../finance/finance.module';
import { Sale } from '../sales/sale.entity';
import { AgentCommission } from './agent-commission.entity';
import { AgentController } from './agent.controller';
import { FranchiseAgreement } from './franchise-agreement.entity';
import { FranchiseController } from './franchise.controller';
import { FranchiseService } from './franchise.service';
import { FranchiseSettlementLine } from './franchise-settlement-line.entity';
import { FranchiseSettlement } from './franchise-settlement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FranchiseAgreement,
      FranchiseSettlement,
      FranchiseSettlementLine,
      AgentCommission,
      Sale,
      Customer,
    ]),
    FinanceModule,
    AccessoriesModule,
  ],
  controllers: [FranchiseController, AgentController],
  providers: [FranchiseService],
  exports: [FranchiseService],
})
export class FranchiseModule {}
