import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FiscalPeriodService, PostingRuleService } from './fiscal-period.service';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FiscalPeriodController {
  constructor(
    private readonly fiscalPeriodService: FiscalPeriodService,
    private readonly postingRuleService: PostingRuleService,
  ) {}

  @Get('fiscal-periods')
  fiscalPeriods() {
    return this.fiscalPeriodService.list();
  }

  @Get('posting-rules')
  postingRules() {
    return this.postingRuleService.list();
  }
}
