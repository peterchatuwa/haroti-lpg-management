import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBundle } from '../accessories/product-bundle.entity';
import { AccessoryStock } from '../accessories/accessory-stock.entity';
import { Cylinder } from '../cylinders/cylinder.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Product } from '../products/product.entity';
import { Station } from '../stations/station.entity';
import { PublicCatalogService } from './public-catalog.service';
import { PublicController } from './public.controller';
import { PublicFormsService } from './public-forms.service';
import { PublicOrdersService } from './public-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      AccessoryStock,
      Station,
      Cylinder,
      ProductBundle,
    ]),
    NotificationsModule,
  ],
  controllers: [PublicController],
  providers: [PublicCatalogService, PublicFormsService, PublicOrdersService],
})
export class PublicModule {}
