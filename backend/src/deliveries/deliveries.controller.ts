import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@UseGuards(JwtAuthGuard)
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
}
