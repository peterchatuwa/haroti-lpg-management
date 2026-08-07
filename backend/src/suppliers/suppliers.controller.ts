import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { CreateStandaloneSupplierDto } from './dto/create-standalone-supplier.dto';
import { SuppliersService } from './suppliers.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get('eligible-customers')
  eligibleCustomers() {
    return this.suppliersService.eligibleCustomers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.STOREKEEPER,
  )
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.createFromCustomer(dto);
  }

  @Post('standalone')
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
  )
  createStandalone(@Body() dto: CreateStandaloneSupplierDto) {
    return this.suppliersService.createStandalone(dto);
  }
}
