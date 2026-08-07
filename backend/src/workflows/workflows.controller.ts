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
import { WorkflowsService } from './workflows.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get('definitions')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.OPERATIONS_MANAGER)
  definitions() {
    return this.workflowsService.listDefinitions();
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approval-tasks')
export class ApprovalTasksController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  inbox(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    return this.workflowsService.inbox(user.role as UserRole, stationId);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.workflowsService.approve(
      id,
      user.sub,
      user.role as UserRole,
    );
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { reason?: string },
  ) {
    return this.workflowsService.reject(id, user.sub, user.role as UserRole);
  }
}
