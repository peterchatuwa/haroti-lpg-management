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
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RecordCustomerPaymentDto } from './dto/record-customer-payment.dto';
import { CustomersService } from './customers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query('stationId') stationId?: string) {
    return this.customersService.findAll(stationId);
  }

  @Get(':id/profile')
  profile(@Param('id') id: string) {
    return this.customersService.profile360(id);
  }

  @Get(':id/statement')
  statement(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.customersService.statement(id, from, to);
  }

  @Post(':id/payments')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.DIRECTOR,
    UserRole.FINANCE_MANAGER,
    UserRole.OPERATIONS_MANAGER,
  )
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordCustomerPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.customersService.recordPayment(id, dto, user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }
}
