import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { TankReadingContext } from '../common/enums';
import { IoTService } from '../iot/iot.service';
import { TanksService } from './tanks.service';

@UseGuards(JwtAuthGuard)
@Controller('tanks')
export class TanksController {
  constructor(
    private readonly tanksService: TanksService,
    private readonly stationScope: StationScopeService,
    private readonly iotService: IoTService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query('stationId') stationId?: string) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.tanksService.listTanks(scoped);
  }

  @Get('readings/:tankId')
  readings(@Param('tankId') tankId: string) {
    return this.tanksService.listReadings(tankId);
  }

  @Post('readings')
  record(
    @Body()
    body: {
      tankId: string;
      readingKg: number;
      context: TankReadingContext;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tanksService.recordReading({ ...body, userId: user.sub });
  }

  @Get('reconciliation')
  reconciliation(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    this.stationScope.assertStationAccess(user, stationId);
    const start =
      periodStart ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .slice(0, 10);
    const end = periodEnd ?? new Date().toISOString().slice(0, 10);
    return this.tanksService.gasReconciliation(stationId, start, end);
  }

  @Get('loss-cases')
  lossCases(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.tanksService.listLossCases(scoped);
  }

  @Get('runout-forecast')
  runout(@Query('windowDays') windowDays?: string) {
    return this.tanksService.runoutForecast(Number(windowDays) || 14);
  }

  @Get('reorder-suggestions')
  reorder() {
    return this.tanksService.reorderSuggestions();
  }

  @Post('loss-cases/:id')
  updateLossCase(
    @Param('id') id: string,
    @Body()
    body: {
      status?: string;
      category?: string;
      investigatorId?: string;
      rootCause?: string;
      correctiveAction?: string;
      notes?: string;
    },
  ) {
    return this.tanksService.updateLossCase(id, body as never);
  }

  @Post('loss-cases/:id/actions')
  addLossAction(
    @Param('id') id: string,
    @Body() body: { description: string; assignedToId?: string; dueDate?: string },
  ) {
    return this.tanksService.addLossCaseAction(id, body);
  }

  @Get(':id/telemetry')
  tankTelemetry(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.iotService.tankTelemetry(id, limit ? Number(limit) : 50);
  }
}
