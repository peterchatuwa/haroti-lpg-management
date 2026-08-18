import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { UserRole } from '../common/enums';
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

  @Get('pending-discounts')
  pendingDiscounts(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.salesService.listPendingDiscounts(scoped);
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

  @Post(':id/approve-discount')
  approveDiscount(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.salesService.approveDiscount(id, user.sub, user.role);
  }

  @Post(':id/void')
  @UseGuards(RolesGuard)
  @Roles(
    UserRole.STATION_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  voidSale(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.salesService.voidSale(id, user.sub, body.reason);
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
