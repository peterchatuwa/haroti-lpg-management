import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentMethod, UserRole } from '../common/enums';
import { PaycService } from './payc.service';

const PAYC_OPERATORS = [
  UserRole.SYSTEM_ADMIN,
  UserRole.DIRECTOR,
  UserRole.OPERATIONS_MANAGER,
  UserRole.STATION_MANAGER,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payc')
export class PaycController {
  constructor(private readonly paycService: PaycService) {}

  @Get('meters')
  @Roles(...PAYC_OPERATORS, UserRole.STOREKEEPER, UserRole.FINANCE_MANAGER)
  meters() {
    return this.paycService.findAll();
  }

  @Get('meters/:id')
  @Roles(...PAYC_OPERATORS, UserRole.STOREKEEPER, UserRole.FINANCE_MANAGER)
  meter(@Param('id') id: string) {
    return this.paycService.findOne(id);
  }

  @Get('meters/:id/telemetry')
  @Roles(...PAYC_OPERATORS, UserRole.STOREKEEPER, UserRole.FINANCE_MANAGER)
  telemetry(@Param('id') id: string) {
    return this.paycService.telemetryHistory(id);
  }

  @Get('meters/:id/credits')
  @Roles(...PAYC_OPERATORS, UserRole.STOREKEEPER, UserRole.FINANCE_MANAGER)
  credits(@Param('id') id: string) {
    return this.paycService.creditHistory(id);
  }

  @Get('meters/:id/commands')
  @Roles(...PAYC_OPERATORS)
  commands(@Param('id') id: string) {
    return this.paycService.commandHistory(id);
  }

  @Get('meters/:id/vendor')
  @Roles(...PAYC_OPERATORS)
  vendorSnapshot(@Param('id') id: string) {
    return this.paycService.getMeterVendorSnapshot(id);
  }

  @Post('meters/:id/commands/refresh')
  @Roles(...PAYC_OPERATORS)
  refreshCommands(@Param('id') id: string) {
    return this.paycService.refreshMeterCommands(id);
  }

  @Get('commands/:commandId/status')
  @Roles(...PAYC_OPERATORS)
  commandStatus(@Param('commandId') commandId: string) {
    return this.paycService.getCommandStatus(commandId);
  }

  @Get('dashboard')
  @Roles(...PAYC_OPERATORS, UserRole.STOREKEEPER, UserRole.FINANCE_MANAGER)
  dashboard() {
    return this.paycService.dashboard();
  }

  @Get('vendor/status')
  @Roles(...PAYC_OPERATORS)
  vendorStatus() {
    return this.paycService.getVendorStatus();
  }

  @Post('import-vendor')
  @Roles(...PAYC_OPERATORS)
  importVendor() {
    return this.paycService.importFromVendor();
  }

  @Patch('meters/:id')
  @Roles(...PAYC_OPERATORS)
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
  @Roles(...PAYC_OPERATORS)
  valve(
    @Param('id') id: string,
    @Body() body: { open: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paycService.controlValve(id, body.open, user.sub);
  }

  @Post('meters/:id/command')
  @Roles(...PAYC_OPERATORS)
  deviceCommand(
    @Param('id') id: string,
    @Body() body: { command: 'queryFlowAndStatus' | 'queryBattery' },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paycService.sendDeviceCommand(id, body.command, user.sub);
  }

  @Post('meters/:id/topup')
  @Roles(...PAYC_OPERATORS)
  topup(
    @Param('id') id: string,
    @Body()
    body: { amountMwk: number; paymentMethod: PaymentMethod; reference?: string },
  ) {
    return this.paycService.topUpCredit({ meterId: id, ...body });
  }

  @Post('meters/:id/rebind-cylinder')
  @Roles(...PAYC_OPERATORS)
  rebind(
    @Param('id') id: string,
    @Body() body: { cylinderSerial: string },
  ) {
    return this.paycService.rebindCylinder(id, body.cylinderSerial);
  }

  @Post('meters/:id/sync-vendor')
  @Roles(...PAYC_OPERATORS)
  syncVendor(@Param('id') id: string) {
    return this.paycService.syncMeterFromVendor(id);
  }

  @Post('sync-vendor')
  @Roles(...PAYC_OPERATORS)
  syncAllVendor() {
    return this.paycService.syncAllMetersFromVendor();
  }

  @Post('run-alerts')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DIRECTOR, UserRole.OPERATIONS_MANAGER)
  runAlerts() {
    return this.paycService.runScheduledSyncAndAlerts();
  }

  @Post('telemetry')
  @Roles(UserRole.SYSTEM_ADMIN)
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
  @Roles(UserRole.SYSTEM_ADMIN)
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
