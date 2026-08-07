import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { ThreeWayMatchService } from './three-way-match.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('supplier-invoices')
export class SupplierInvoicesController {
  constructor(private readonly threeWayMatch: ThreeWayMatchService) {}

  @Get()
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.STOREKEEPER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
    UserRole.DIRECTOR,
  )
  list() {
    return this.threeWayMatch.list();
  }

  @Post()
  @Roles(
    UserRole.FINANCE_MANAGER,
    UserRole.STOREKEEPER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  register(
    @Body()
    body: {
      invoiceNumber: string;
      supplierId: string;
      purchaseOrderId?: string;
      invoiceDate: string;
      dueDate?: string;
      amount: number;
      taxAmount?: number;
      notes?: string;
    },
  ) {
    return this.threeWayMatch.register(body);
  }

  @Post(':id/match')
  @Roles(UserRole.FINANCE_MANAGER, UserRole.SYSTEM_ADMIN)
  match(@Param('id') id: string) {
    return this.threeWayMatch.runMatch(id);
  }

  @Post(':id/approve-variance')
  @Roles(UserRole.FINANCE_MANAGER, UserRole.DIRECTOR, UserRole.SYSTEM_ADMIN)
  approveVariance(@Param('id') id: string) {
    return this.threeWayMatch.approveVariance(id);
  }
}
