import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { AgeingService } from './ageing.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/ageing')
export class AgeingController {
  constructor(private readonly ageingService: AgeingService) {}

  @Get('ar')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.AUDITOR,
    UserRole.SYSTEM_ADMIN,
  )
  ar(@Query('stationId') stationId?: string) {
    return this.ageingService.arAgeing(stationId);
  }

  @Get('ap')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.AUDITOR,
    UserRole.SYSTEM_ADMIN,
  )
  ap() {
    return this.ageingService.apAgeing();
  }

  @Get('snapshot')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.AUDITOR,
    UserRole.SYSTEM_ADMIN,
  )
  snapshot() {
    return this.ageingService.snapshot();
  }
}
