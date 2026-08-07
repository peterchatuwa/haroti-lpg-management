import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RefillRequestStatus, UserRole } from '../common/enums';
import {
  CurrentCustomer,
  CustomerAuthGuard,
} from './customer-auth.guard';
import type { CustomerJwtPayload } from './customer-jwt-payload';
import { CustomerPortalService } from './customer-portal.service';

@Controller('customer-portal')
export class CustomerPortalController {
  constructor(private readonly portalService: CustomerPortalService) {}

  @Post('auth/request-otp')
  requestOtp(@Body() body: { phone: string }) {
    return this.portalService.requestOtp(body.phone);
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: { phone: string; code: string }) {
    return this.portalService.verifyOtp(body.phone, body.code);
  }

  @Get('me')
  @UseGuards(CustomerAuthGuard)
  me(@CurrentCustomer() customer: CustomerJwtPayload) {
    return this.portalService.profile(customer.sub);
  }

  @Get('prices')
  @UseGuards(CustomerAuthGuard)
  prices() {
    return this.portalService.prices();
  }

  @Get('stations')
  @UseGuards(CustomerAuthGuard)
  stations() {
    return this.portalService.nearbyStations();
  }

  @Get('receipts')
  @UseGuards(CustomerAuthGuard)
  receipts(@CurrentCustomer() customer: CustomerJwtPayload) {
    return this.portalService.receipts(customer.sub);
  }

  @Get('statement')
  @UseGuards(CustomerAuthGuard)
  statement(@CurrentCustomer() customer: CustomerJwtPayload) {
    return this.portalService.statement(customer.sub);
  }

  @Get('payc')
  @UseGuards(CustomerAuthGuard)
  payc(@CurrentCustomer() customer: CustomerJwtPayload) {
    return this.portalService.paycMeters(customer.sub);
  }

  @Get('loyalty')
  @UseGuards(CustomerAuthGuard)
  loyalty(@CurrentCustomer() customer: CustomerJwtPayload) {
    return this.portalService.loyalty(customer.sub);
  }

  @Post('refill-requests')
  @UseGuards(CustomerAuthGuard)
  createRequest(
    @CurrentCustomer() customer: CustomerJwtPayload,
    @Body()
    body: {
      stationId?: string;
      quantityKg: number;
      preferredDate?: string;
      notes?: string;
    },
  ) {
    return this.portalService.createRefillRequest(customer.sub, body);
  }

  @Get('refill-requests')
  @UseGuards(CustomerAuthGuard)
  myRequests(@CurrentCustomer() customer: CustomerJwtPayload) {
    return this.portalService.listRefillRequests(customer.sub);
  }

  @Get('admin/refill-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STATION_MANAGER, UserRole.OPERATIONS_MANAGER, UserRole.SYSTEM_ADMIN)
  adminRequests() {
    return this.portalService.listAllRefillRequests();
  }

  @Patch('admin/refill-requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STATION_MANAGER, UserRole.OPERATIONS_MANAGER, UserRole.SYSTEM_ADMIN)
  updateRequest(
    @Param('id') id: string,
    @Body() body: { status: RefillRequestStatus },
  ) {
    return this.portalService.updateRefillRequest(id, body.status);
  }
}
