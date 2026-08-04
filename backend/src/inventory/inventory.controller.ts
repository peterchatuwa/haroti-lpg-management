import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryService } from './inventory.service';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly stationScope: StationScopeService,
  ) {}

  @Get('movements')
  list(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.inventoryService.listMovements(scoped);
  }

  @Get('position/:stationId')
  position(
    @Param('stationId') stationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.stationScope.assertStationAccess(user, stationId);
    return this.inventoryService.stockPosition(stationId);
  }

  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto, @CurrentUser() user: JwtPayload) {
    this.stationScope.assertStationAccess(user, dto.stationId);
    return this.inventoryService.adjustStock(dto, user.sub);
  }
}
