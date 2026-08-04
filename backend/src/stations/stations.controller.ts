import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StationsService } from './stations.service';

@UseGuards(JwtAuthGuard)
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  findAll() {
    return this.stationsService.findAll();
  }

  @Get('summary/stock')
  stockSummary() {
    return this.stationsService.getStockSummary();
  }

  @Get(':id/overview')
  overview(@Param('id') id: string) {
    return this.stationsService.overview(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }
}
