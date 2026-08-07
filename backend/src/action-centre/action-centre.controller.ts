import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { ActionCentreService } from './action-centre.service';

@UseGuards(JwtAuthGuard)
@Controller('action-centre')
export class ActionCentreController {
  constructor(
    private readonly actionCentreService: ActionCentreService,
    private readonly stationScope: StationScopeService,
  ) {}

  @Get()
  summary(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.actionCentreService.summary(scoped);
  }
}
