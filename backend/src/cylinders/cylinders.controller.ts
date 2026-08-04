import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { CylindersService } from './cylinders.service';

@UseGuards(JwtAuthGuard)
@Controller('cylinders')
export class CylindersController {
  constructor(
    private readonly cylindersService: CylindersService,
    private readonly stationScope: StationScopeService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query('stationId') stationId?: string) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.cylindersService.findAll(scoped);
  }

  @Get('movements')
  movements(@Query('cylinderId') cylinderId?: string) {
    return this.cylindersService.listMovements(cylinderId);
  }

  @Get('lookup/:serial')
  lookup(@Param('serial') serial: string) {
    return this.cylindersService.findBySerial(serial);
  }

  @Post('swap')
  swap(
    @Body()
    body: {
      stationId: string;
      customerId: string;
      incomingSerial: string;
      outgoingSerial: string;
      saleId?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    this.stationScope.assertStationAccess(user, body.stationId);
    return this.cylindersService.swap({ ...body, userId: user.sub });
  }
}
