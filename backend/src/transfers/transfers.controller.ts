import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import {
  CreateTransferDto,
  ReceiveTransferDto,
} from './dto/create-transfer.dto';
import { TransfersService } from './transfers.service';

@UseGuards(JwtAuthGuard)
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  findAll() {
    return this.transfersService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTransferDto, @CurrentUser() user: JwtPayload) {
    return this.transfersService.create(dto, user.sub);
  }

  @Post(':id/receive')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceiveTransferDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.transfersService.receive(id, dto, user.sub);
  }
}
