import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { BankingService } from './banking.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Post('mobile-money/import')
  @Roles(UserRole.FINANCE_MANAGER, UserRole.STATION_MANAGER, UserRole.SYSTEM_ADMIN)
  import(
    @Body() body: { stationId?: string; csvText: string },
  ) {
    return this.bankingService.importCsv(body);
  }

  @Get('mobile-money/lines')
  @Roles(UserRole.FINANCE_MANAGER, UserRole.STATION_MANAGER, UserRole.SYSTEM_ADMIN)
  lines(@Query('stationId') stationId?: string) {
    return this.bankingService.reconciliation(stationId);
  }

  @Get('mobile-money/summary')
  @Roles(UserRole.FINANCE_MANAGER, UserRole.STATION_MANAGER, UserRole.SYSTEM_ADMIN)
  summary(@Query('stationId') stationId?: string) {
    return this.bankingService.summary(stationId);
  }
}
