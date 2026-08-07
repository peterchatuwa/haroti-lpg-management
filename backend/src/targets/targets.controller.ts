import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { CreateTargetDto } from './dto/create-target.dto';
import { TargetsService } from './targets.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('targets')
export class TargetsController {
  constructor(private readonly targetsService: TargetsService) {}

  @Get()
  list(@Query('stationId') stationId?: string) {
    return this.targetsService.list(stationId);
  }

  @Get('progress')
  progress(@Query('stationId') stationId?: string) {
    return this.targetsService.progress(stationId);
  }

  @Post()
  @Roles(
    UserRole.DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  create(@Body() dto: CreateTargetDto) {
    return this.targetsService.create(dto);
  }

  @Patch(':id')
  @Roles(
    UserRole.DIRECTOR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  update(@Param('id') id: string, @Body() body: { targetValue: number }) {
    return this.targetsService.update(id, body.targetValue);
  }
}
