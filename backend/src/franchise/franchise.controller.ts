import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { FranchiseService } from './franchise.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('franchise')
export class FranchiseController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get('agreements')
  agreements() {
    return this.franchiseService.listAgreements();
  }

  @Get('settlements')
  settlements() {
    return this.franchiseService.listSettlements();
  }

  @Post('settlements/generate')
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
    UserRole.DIRECTOR,
  )
  generate(
    @Body()
    body: { agreementId: string; periodStart: string; periodEnd: string },
  ) {
    return this.franchiseService.generateSettlement(
      body.agreementId,
      body.periodStart,
      body.periodEnd,
    );
  }

  @Post('settlements/:id/invoice')
  @Roles(UserRole.FINANCE_MANAGER, UserRole.SYSTEM_ADMIN, UserRole.DIRECTOR)
  invoice(@Param('id') id: string) {
    return this.franchiseService.invoiceSettlement(id);
  }

  @Get('commissions')
  commissions(@Query('agentId') agentId?: string) {
    return this.franchiseService.listAgentCommissions(agentId);
  }
}
