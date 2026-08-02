import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@Query('stationId') stationId?: string) {
    return this.salesService.findAll(stationId);
  }

  @Get('summary/today')
  today(@Query('stationId') stationId?: string) {
    return this.salesService.todaySummary(stationId);
  }

  @Get('price/:stationId')
  price(@Param('stationId') stationId: string) {
    return this.salesService.getActivePrice(stationId).then((pricePerKg) => ({
      pricePerKg,
    }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: JwtPayload) {
    return this.salesService.createSale(dto, user.sub);
  }
}
