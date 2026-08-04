import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { AccessoryStock } from './accessory-stock.entity';
import { AccessoriesController } from './accessories.controller';
import { AccessoriesService } from './accessories.service';
import { ChannelPrice } from './channel-price.entity';
import { ProductBundleItem } from './product-bundle-item.entity';
import { ProductBundle } from './product-bundle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AccessoryStock,
      ChannelPrice,
      ProductBundle,
      ProductBundleItem,
      Product,
    ]),
  ],
  controllers: [AccessoriesController],
  providers: [AccessoriesService],
  exports: [AccessoriesService],
})
export class AccessoriesModule {}
