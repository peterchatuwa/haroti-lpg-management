import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SalesChannel, StockOwnership, UserRole } from '../common/enums';
import { AccessoriesService } from './accessories.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accessories')
export class AccessoriesController {
  constructor(private readonly accessoriesService: AccessoriesService) {}

  @Get('stock')
  stock(@Query('stationId') stationId?: string) {
    return this.accessoriesService.listStock(stationId);
  }

  @Get('low-stock')
  @Roles(UserRole.STATION_MANAGER, UserRole.OPERATIONS_MANAGER, UserRole.STOREKEEPER)
  lowStock() {
    return this.accessoriesService.listLowStock();
  }

  @Get('catalog')
  catalog() {
    return this.accessoriesService.listAccessories();
  }

  @Get('bundles')
  bundles() {
    return this.accessoriesService.listBundles();
  }

  @Get('prices')
  prices(@Query('productId') productId?: string) {
    return this.accessoriesService.listChannelPrices(productId);
  }

  @Get('price/:productId/:channel')
  price(
    @Param('productId') productId: string,
    @Param('channel') channel: SalesChannel,
  ) {
    return this.accessoriesService.getPrice(productId, channel);
  }

  @Get('barcode/:code')
  barcode(@Param('code') code: string) {
    return this.accessoriesService.findByBarcode(code);
  }

  @Get('bundles/:id/explode')
  explode(@Param('id') id: string) {
    return this.accessoriesService.explodeBundle(id);
  }

  @Post('receive')
  @Roles(UserRole.STOREKEEPER, UserRole.STATION_MANAGER, UserRole.OPERATIONS_MANAGER)
  receive(
    @Body()
    body: {
      stationId: string;
      productId: string;
      quantity: number;
      ownership?: StockOwnership;
      batchNumber?: string;
    },
  ) {
    return this.accessoriesService.receiveStock(body);
  }
}
