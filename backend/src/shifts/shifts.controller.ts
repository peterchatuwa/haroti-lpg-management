import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';
import { ShiftsService } from './shifts.service';

@UseGuards(JwtAuthGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  findAll(@Query('stationId') stationId?: string) {
    return this.shiftsService.findAll(stationId);
  }

  @Get('current')
  current(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    return this.shiftsService.currentOpen(user.sub, stationId);
  }

  @Post('open')
  open(@Body() dto: OpenShiftDto, @CurrentUser() user: JwtPayload) {
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
}
