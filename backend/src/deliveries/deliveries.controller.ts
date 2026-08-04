import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { UserRole } from '../common/enums';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  findAll(@Query('stationId') stationId?: string) {
    return this.deliveriesService.findAll(stationId);
  }

  @Post()
  create(@Body() dto: CreateDeliveryDto, @CurrentUser() user: JwtPayload) {
    return this.deliveriesService.create(dto, user.sub);
  }

  @Post(':id/advance')
  @Roles(UserRole.STATION_MANAGER, UserRole.OPERATIONS_MANAGER, UserRole.STOREKEEPER)
  advance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.deliveriesService.advanceStatus(id, user.sub);
  }

  @Post(':id/approve')
  @Roles(UserRole.STATION_MANAGER, UserRole.OPERATIONS_MANAGER)
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.deliveriesService.approve(id, user.sub);
  }
}
