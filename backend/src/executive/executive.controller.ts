import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { ExecutiveService } from './executive.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('executive')
export class ExecutiveController {
  constructor(private readonly executiveService: ExecutiveService) {}

  @Get('overview')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.SYSTEM_ADMIN,
    UserRole.FINANCE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
  )
  overview() {
    return this.executiveService.overview();
  }

  @Get('station-rankings')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.SYSTEM_ADMIN,
    UserRole.FINANCE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
  )
  rankings(@Query('metric') metric?: string) {
    return this.executiveService.stationRankings(metric ?? 'revenue');
  }

  @Get('exceptions')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.SYSTEM_ADMIN,
    UserRole.FINANCE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
  )
  exceptions() {
    return this.executiveService.exceptions();
  }
}
