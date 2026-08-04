import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('executive')
  executive() {
    return this.reportsService.executiveSummary();
  }

  @Get('stations')
  stations() {
    return this.reportsService.stationProfitability();
  }

  @Get('trends')
  trends(@Query('days') days?: string) {
    return this.reportsService.revenueTrend(Number(days ?? 14));
  }

  @Get('cashflow')
  cashflow() {
    return this.reportsService.cashFlowForecast();
  }

  @Get('franchise')
  franchise() {
    return this.reportsService.franchiseReport();
  }
}
