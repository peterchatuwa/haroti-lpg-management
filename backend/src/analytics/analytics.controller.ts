import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { StaffAnalyticsService } from './staff-analytics.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: StaffAnalyticsService) {}

  @Get('staff/attendants')
  @Roles(
    UserRole.STATION_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  attendants(
    @Query('stationId') stationId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.analyticsService.attendantScorecards({
      stationId,
      periodStart,
      periodEnd,
    });
  }

  @Get('staff/managers')
  @Roles(
    UserRole.OPERATIONS_MANAGER,
    UserRole.DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  managers(
    @Query('stationId') stationId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    return this.analyticsService.managerScorecards({
      stationId,
      periodStart,
      periodEnd,
    });
  }

  @Get('network-flash')
  @Roles(UserRole.DIRECTOR, UserRole.OPERATIONS_MANAGER, UserRole.SYSTEM_ADMIN)
  networkFlash() {
    return this.analyticsService.networkFlash();
  }
}
