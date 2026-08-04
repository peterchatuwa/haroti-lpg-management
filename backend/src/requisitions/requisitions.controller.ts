import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { RequisitionStatus } from '../common/enums';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { RequisitionsService } from './requisitions.service';

@UseGuards(JwtAuthGuard)
@Controller('requisitions')
export class RequisitionsController {
  constructor(
    private readonly requisitionsService: RequisitionsService,
    private readonly stationScope: StationScopeService,
  ) {}

  @Get('pending-summary')
  pendingSummary() {
    return this.requisitionsService.pendingSummary();
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
    @Query('status') status?: RequisitionStatus,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.requisitionsService.findAll(scoped, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requisitionsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRequisitionDto, @CurrentUser() user: JwtPayload) {
    this.stationScope.assertStationAccess(user, dto.stationId);
    return this.requisitionsService.create(dto, user.sub, user.role);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.requisitionsService.approve(id, user.sub, user.role);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requisitionsService.reject(id, user.sub, user.role, body.reason);
  }

  @Post(':id/pay')
  pay(
    @Param('id') id: string,
    @Body() body: { paymentReference?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.requisitionsService.pay(
      id,
      user.sub,
      user.role,
      body.paymentReference,
    );
  }
}
