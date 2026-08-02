import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
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
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('expenses')
  findAll(@Query('stationId') stationId?: string) {
    return this.expensesService.findAll(stationId);
  }

  @Post('expenses')
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: JwtPayload) {
    return this.expensesService.create(dto, user.sub);
  }

  @Get('deposits')
  deposits(@Query('stationId') stationId?: string) {
    return this.expensesService.listDeposits(stationId);
  }

  @Post('deposits')
  createDeposit(
    @Body() dto: CreateDepositDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.createDeposit({ ...dto, userId: user.sub });
  }
}
