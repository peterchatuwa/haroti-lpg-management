import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaycService } from './payc.service';

@UseGuards(JwtAuthGuard)
@Controller('payc')
export class PaycController {
  constructor(private readonly paycService: PaycService) {}

  @Get('meters')
  meters() {
    return this.paycService.findAll();
  }

  @Get('dashboard')
  dashboard() {
    return this.paycService.dashboard();
  }

  @Post('telemetry')
  telemetry(
    @Body()
    body: {
      meterSerial: string;
      burnKg: number;
      creditRemainingKg: number;
      valveOpen: boolean;
    },
  ) {
    return this.paycService.ingestTelemetry(body);
  }
}
