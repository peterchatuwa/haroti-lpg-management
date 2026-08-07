import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { IoTService } from './iot.service';

@Controller('iot')
export class IoTController {
  constructor(
    private readonly iotService: IoTService,
    private readonly config: ConfigService,
  ) {}

  @Post('telemetry')
  ingest(
    @Headers('x-iot-api-key') apiKey: string | undefined,
    @Body()
    body: {
      deviceKey: string;
      levelKg?: number;
      pressureBar?: number;
      temperatureC?: number;
      recordedAt?: string;
      raw?: Record<string, unknown>;
    },
  ) {
    const expected = this.config.get<string>('IOT_API_KEY', 'haroti-iot-dev');
    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('Invalid IoT API key');
    }
    return this.iotService.ingestTelemetry(body);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.STATION_MANAGER, UserRole.SYSTEM_ADMIN)
  devices(@Query('stationId') stationId?: string) {
    return this.iotService.listDevices(stationId);
  }
}
