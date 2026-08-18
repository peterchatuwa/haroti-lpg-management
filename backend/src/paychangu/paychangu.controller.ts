import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaychanguService } from './paychangu.service';
import { PaymentMethod } from '../common/enums';

@Controller('paychangu')
export class PaychanguController {
  constructor(private readonly paychanguService: PaychanguService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Body()
    body: {
      amount: number;
      paymentMethod: PaymentMethod;
      customerPhone?: string;
      customerEmail?: string;
      internalRef: string;
      saleId?: string;
      paycMeterId?: string;
      metadata?: Record<string, any>;
    },
  ) {
    return this.paychanguService.initiatePayment(body);
  }

  @Post('webhook')
  async webhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-paychangu-signature') signature: string,
  ) {
    await this.paychanguService.processWebhook(
      payload as {
        event_type: string;
        transaction_ref: string;
        [key: string]: unknown;
      },
      signature,
    );
    return { success: true };
  }

  @Get('transaction/:ref')
  @UseGuards(JwtAuthGuard)
  async getTransaction(@Param('ref') ref: string) {
    return this.paychanguService.queryPayment(ref);
  }
}
