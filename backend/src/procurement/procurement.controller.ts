import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  @Post('orders')
  @Roles(
    UserRole.STOREKEEPER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
  )
  create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: JwtPayload) {
    return this.procurementService.create(dto, user.sub);
  }

  @Post('orders/:id/submit')
  @Roles(
    UserRole.STOREKEEPER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
  )
  submit(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.procurementService.submitForApproval(id, user.sub);
  }

  @Post('orders/:id/approve')
  @Roles(
    UserRole.STATION_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.DIRECTOR,
  )
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.procurementService.approve(id, user.sub, user.role);
  }

  @Post('orders/:id/place-order')
  @Roles(
    UserRole.STOREKEEPER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
  )
  placeOrder(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.procurementService.placeOrder(id, user.sub);
  }

  @Post('orders/:id/receive')
  @Roles(UserRole.STOREKEEPER, UserRole.OPERATIONS_MANAGER)
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
