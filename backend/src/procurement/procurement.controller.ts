import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { PurchaseOrderStatus, UserRole } from '../common/enums';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ProcurementService } from './procurement.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('orders')
  orders(@Query('status') status?: PurchaseOrderStatus) {
    return this.procurementService.findAll(status);
  }

  @Get('orders/:id')
  order(@Param('id') id: string) {
    return this.procurementService.findOne(id);
  }

  @Get('orders/:id/documents')
  orderDocuments(@Param('id') id: string) {
    return this.procurementService.listDocuments(id);
  }

  @Get('documents/:id')
  document(@Param('id') id: string) {
    return this.procurementService.getDocument(id);
  }

  @Get('documents/:id/pdf')
  async documentPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } =
      await this.procurementService.getDocumentPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  private static readonly PROCUREMENT_WRITE_ROLES = [
    UserRole.STOREKEEPER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.SYSTEM_ADMIN,
    UserRole.DIRECTOR,
  ] as const;

  @Post('orders')
  @Roles(...ProcurementController.PROCUREMENT_WRITE_ROLES)
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: JwtPayload) {
    return this.procurementService.create(dto, user.sub);
  }

  @Post('orders/:id/submit')
  @Roles(...ProcurementController.PROCUREMENT_WRITE_ROLES)
  submit(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.procurementService.submitForApproval(id, user.sub);
  }

  @Post('orders/:id/approve')
  @Roles(
    UserRole.STATION_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
    UserRole.SYSTEM_ADMIN,
  )
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.procurementService.approve(id, user.sub, user.role);
  }

  @Post('orders/:id/place-order')
  @Roles(...ProcurementController.PROCUREMENT_WRITE_ROLES)
  placeOrder(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.procurementService.placeOrder(id, user.sub);
  }

  @Post('orders/:id/receive')
  @Roles(
    UserRole.STOREKEEPER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
    UserRole.DIRECTOR,
  )
  receive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.procurementService.receive(id, user.sub);
  }

  @Post('orders/:id/pay')
  @Roles(UserRole.FINANCE_MANAGER, UserRole.DIRECTOR, UserRole.SYSTEM_ADMIN)
  pay(
    @Param('id') id: string,
    @Body() body: { paymentReference?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.procurementService.pay(id, user.sub, body.paymentReference);
  }
}
