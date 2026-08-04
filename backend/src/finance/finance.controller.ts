import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { FinanceService } from './finance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('journals')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.AUDITOR,
    UserRole.SYSTEM_ADMIN,
  )
  journals() {
    return this.financeService.findEntries(100);
  }

  @Get('trial-balance')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.AUDITOR,
    UserRole.SYSTEM_ADMIN,
  )
  trialBalance() {
    return this.financeService.trialBalance();
  }

  @Get('budget-vs-actual')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
  )
  budgetVsActual(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    return this.financeService.budgetVsActual(
      Number(year ?? now.getFullYear()),
      Number(month ?? now.getMonth() + 1),
    );
  }
}
