import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoryStock } from '../accessories/accessory-stock.entity';
import { ChannelPrice } from '../accessories/channel-price.entity';
import { ProductBundleItem } from '../accessories/product-bundle-item.entity';
import { ProductBundle } from '../accessories/product-bundle.entity';
import { Customer } from '../customers/customer.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { BudgetLine } from '../finance/budget-line.entity';
import { FranchiseAgreement } from '../franchise/franchise-agreement.entity';
import { Asset } from '../maintenance/asset.entity';
import { PaycCreditTransaction } from '../payc/payc-credit-transaction.entity';
import { PaycMeter } from '../payc/payc-meter.entity';
import { PaycTelemetry } from '../payc/payc-telemetry.entity';
import { CapitalProject } from '../projects/capital-project.entity';
import { ProjectMilestone } from '../projects/project-milestone.entity';
import { PriceList } from '../pricing/price-list.entity';
import { Product } from '../products/product.entity';
import { Station } from '../stations/station.entity';
import { Supplier } from '../suppliers/supplier.entity';
import { User } from '../users/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Station,
      User,
      Supplier,
      Product,
      Customer,
      Cylinder,
      PriceList,
      ProductBundle,
      ProductBundleItem,
      ChannelPrice,
      AccessoryStock,
      PaycMeter,
      PaycTelemetry,
      PaycCreditTransaction,
      BudgetLine,
      Asset,
      CapitalProject,
      ProjectMilestone,
      FranchiseAgreement,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
