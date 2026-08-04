import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { StationScopeService } from '../auth/station-scope.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensesService } from './expenses.service';

class CreateDepositDto {
  @IsUUID()
  stationId!: string;

  @IsString()
  depositDate!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  slipNumber?: string;

  @IsOptional()
  @IsString()
  collectionAgent?: string;

  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

@UseGuards(JwtAuthGuard)
@Controller()
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly stationScope: StationScopeService,
  ) {}

  @Get('expenses')
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.expensesService.findAll(scoped);
  }

  @Post('expenses')
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: JwtPayload) {
    this.stationScope.assertStationAccess(user, dto.stationId);
    return this.expensesService.create(dto, user.sub);
  }

  @Post('expenses/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expensesService.approve(id, user.sub, user.role);
  }

  @Post('expenses/:id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.expensesService.reject(id, user.sub);
  }

  @Get('deposits')
  deposits(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    const scoped = this.stationScope.resolveStationFilter(user, stationId);
    return this.expensesService.listDeposits(scoped);
  }

  @Post('deposits')
  createDeposit(
    @Body() dto: CreateDepositDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.stationScope.assertStationAccess(user, dto.stationId);
    return this.expensesService.createDeposit({ ...dto, userId: user.sub });
  }
}
