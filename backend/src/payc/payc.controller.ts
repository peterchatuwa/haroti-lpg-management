import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentMethod } from '../common/enums';
import { PaycService } from './payc.service';

@UseGuards(JwtAuthGuard)
@Controller('payc')
export class PaycController {
  constructor(private readonly paycService: PaycService) {}

  @Get('meters')
  meters() {
    return this.paycService.findAll();
  }

  @Get('meters/:id')
  meter(@Param('id') id: string) {
    return this.paycService.findOne(id);
  }

  @Get('meters/:id/telemetry')
  telemetry(@Param('id') id: string) {
    return this.paycService.telemetryHistory(id);
  }

  @Get('meters/:id/credits')
  credits(@Param('id') id: string) {
    return this.paycService.creditHistory(id);
  }

  @Get('dashboard')
  dashboard() {
    return this.paycService.dashboard();
  }

  @Get('vendor/status')
  vendorStatus() {
    return this.paycService.getVendorStatus();
  }

  @Post('import-vendor')
  importVendor() {
    return this.paycService.importFromVendor();
  }

  @Patch('meters/:id')
  updateMeter(
    @Param('id') id: string,
    @Body()
    body: {
      customerId?: string | null;
      stationId?: string | null;
      location?: string;
      cylinderSerial?: string;
    },
  ) {
    return this.paycService.updateMeter(id, body);
  }

  @Post('meters/:id/valve')
  valve(
    @Param('id') id: string,
    @Body() body: { open: boolean },
  ) {
    return this.paycService.controlValve(id, body.open);
  }

  @Post('meters/:id/topup')
  topup(
    @Param('id') id: string,
    @Body()
    body: { amountMwk: number; paymentMethod: PaymentMethod; reference?: string },
  ) {
    return this.paycService.topUpCredit({ meterId: id, ...body });
  }

  @Post('meters/:id/rebind-cylinder')
  rebind(
    @Param('id') id: string,
    @Body() body: { cylinderSerial: string },
  ) {
    return this.paycService.rebindCylinder(id, body.cylinderSerial);
  }

  @Post('meters/:id/sync-vendor')
  syncVendor(@Param('id') id: string) {
    return this.paycService.syncMeterFromVendor(id);
  }

  @Post('sync-vendor')
  syncAllVendor() {
    return this.paycService.syncAllMetersFromVendor();
  }

  @Post('telemetry')
  telemetryIngest(
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

  @Post('telemetry/batch')
  batch(
    @Body()
    body: {
      readings: Array<{
        meterSerial: string;
        burnKg: number;
        creditRemainingKg: number;
        valveOpen: boolean;
      }>;
    },
  ) {
    return this.paycService.ingestBatch(body.readings ?? []);
  }
}
