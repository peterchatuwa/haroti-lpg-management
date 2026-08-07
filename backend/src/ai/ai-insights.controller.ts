import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { AiInsightsService } from './ai-insights.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiInsightsController {
  constructor(private readonly aiService: AiInsightsService) {}

  @Get('forecasts/demand')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.STATION_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  demandForecast(@Query('days') days?: string) {
    return this.aiService.demandForecast(Number(days) || 7);
  }

  @Get('stockout-risk')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.STATION_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  stockoutRisk() {
    return this.aiService.stockoutRisk();
  }

  @Get('anomalies')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.STATION_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  anomalies(@Query('stationId') stationId?: string) {
    return this.aiService.detectAnomalies(stationId);
  }

  @Post('analytics/query')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.STATION_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  query(@Body() body: { question: string }, @CurrentUser() user: JwtPayload) {
    return this.aiService.naturalLanguageQuery(body.question, user);
  }
}
