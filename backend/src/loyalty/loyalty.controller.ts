import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { LoyaltyService } from './loyalty.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('accounts')
  @Roles(
    UserRole.STATION_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  accounts() {
    return this.loyaltyService.listAccounts();
  }

  @Get('customers/:customerId')
  balance(@Param('customerId') customerId: string) {
    return this.loyaltyService.getOrCreate(customerId);
  }

  @Get('customers/:customerId/history')
  history(@Param('customerId') customerId: string) {
    return this.loyaltyService.history(customerId);
  }

  @Post('customers/:customerId/redeem')
  @Roles(UserRole.STATION_MANAGER, UserRole.ATTENDANT, UserRole.SYSTEM_ADMIN)
  redeem(
    @Param('customerId') customerId: string,
    @Body() body: { points: number; description?: string },
  ) {
    return this.loyaltyService.redeem(
      customerId,
      body.points,
      body.description,
    );
  }
}
