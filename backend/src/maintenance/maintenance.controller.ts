import { Controller, Get, Param, Post, Query, UseGuards, Body } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
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

  @Get('assets')
  assets(@Query('stationId') stationId?: string) {
    return this.maintenanceService.listAssets(stationId);
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

  @Post('work-orders/:id/assign')
  @Roles(UserRole.SAFETY_OFFICER, UserRole.STATION_MANAGER)
  assign(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.maintenanceService.assign(id, user.sub);
  }

  @Post('work-orders/:id/complete')
  @Roles(UserRole.SAFETY_OFFICER, UserRole.STATION_MANAGER)
  complete(
    @Param('id') id: string,
    @Query('certificateRef') certificateRef?: string,
  ) {
    return this.maintenanceService.completeHydro(id, certificateRef);
  }

  @Get('plans')
  plans(@Query('stationId') stationId?: string) {
    return this.maintenanceService.listPlans(stationId);
  }

  @Post('plans')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.SYSTEM_ADMIN)
  createPlan(
    @Body()
    body: {
      name: string;
      assetCategory: string;
      stationId?: string;
      assetId?: string;
      intervalDays: number;
      nextDueDate: string;
      description?: string;
    },
  ) {
    return this.maintenanceService.createPlan(body);
  }

  @Post('plans/run-due')
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.SYSTEM_ADMIN)
  runDuePlans() {
    return this.maintenanceService.runDuePlans();
  }
}
