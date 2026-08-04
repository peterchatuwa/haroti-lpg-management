import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FranchiseService } from './franchise.service';

/** Mobile / field agent API (Charter Phase 3). */
@UseGuards(JwtAuthGuard)
@Controller('agent')
export class AgentController {
  constructor(private readonly franchiseService: FranchiseService) {}

  @Get(':agentId/dashboard')
  dashboard(@Param('agentId') agentId: string) {
    return this.franchiseService.agentDashboard(agentId);
  }

  @Post('sales')
  recordSale(
    @Body()
    body: {
      agentId: string;
      stationId: string;
      productId: string;
      quantity: number;
      paymentMethod: string;
      clientTxnId?: string;
    },
  ) {
    return this.franchiseService.recordAgentSale(body);
  }
}
