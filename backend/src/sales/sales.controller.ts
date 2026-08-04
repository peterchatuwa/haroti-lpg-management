import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly stationScope: StationScopeService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.salesService.findAll(scoped);
  }

  @Get('summary/today')
  today(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.salesService.todaySummary(scoped);
  }

  @Get('price/:stationId')
  price(
    @Param('stationId') stationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.stationScope.assertStationAccess(user, stationId);
    return this.salesService.getActivePrice(stationId).then((pricePerKg) => ({
      pricePerKg,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const sale = await this.salesService.findOne(id);
    this.stationScope.assertStationAccess(user, sale.stationId);
    return sale;
  }

  @Post()
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: JwtPayload) {
    this.stationScope.assertStationAccess(user, dto.stationId);
    return this.salesService.createSale(dto, user.sub);
  }
}
