import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole, WorkOrderStatus } from '../common/enums';
import { MaintenanceService } from './maintenance.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('work-orders')
  workOrders(@Query('status') status?: WorkOrderStatus) {
    return this.maintenanceService.findAll(status);
  }

  @Get('hydro-due')
  @Roles(UserRole.SAFETY_OFFICER, UserRole.OPERATIONS_MANAGER)
  hydroDue() {
    return this.maintenanceService.hydroTestDue();
  }

  @Post('generate-hydro-orders')
  @Roles(UserRole.SAFETY_OFFICER, UserRole.OPERATIONS_MANAGER)
  generateHydro() {
    return this.maintenanceService.createHydroTestOrders();
  }

  @Post('work-orders/:id/complete')
  @Roles(UserRole.SAFETY_OFFICER, UserRole.STATION_MANAGER)
  complete(@Param('id') id: string) {
    return this.maintenanceService.complete(id);
  }
}
