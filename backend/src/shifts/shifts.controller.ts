import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';
import { ShiftsService } from './shifts.service';

@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly shiftsService: ShiftsService,
    private readonly stationScope: StationScopeService,
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.shiftsService.findAll(scoped);
  }

  @Get('current')
  current(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.shiftsService.currentOpen(user.sub, scoped);
  }

  @Post('open')
  open(@Body() dto: OpenShiftDto, @CurrentUser() user: JwtPayload) {
    this.stationScope.assertStationAccess(user, dto.stationId);
    return this.shiftsService.openShift(dto, user.sub);
  }

  @Post(':id/close')
  close(
    @Param('id') id: string,
    @Body() dto: CloseShiftDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.shiftsService.closeShift(id, dto, user.sub);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.shiftsService.approveShift(id, user.sub, user.role);
  }
}
