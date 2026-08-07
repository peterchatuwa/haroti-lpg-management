import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NetworkService } from './network.service';

@UseGuards(JwtAuthGuard)
@Controller('network')
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('map')
  map() {
    return this.networkService.mapOverview();
  }
}
