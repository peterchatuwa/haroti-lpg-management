import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { IncidentStatus, IncidentType, UserRole } from '../common/enums';
import { SafetyService } from './safety.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get('incidents')
  incidents(@Query('stationId') stationId?: string) {
    return this.safetyService.listIncidents(stationId);
  }

  @Post('incidents')
  @Roles(
    UserRole.SAFETY_OFFICER,
    UserRole.STATION_MANAGER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  createIncident(
    @Body()
    body: {
      type: IncidentType;
      severity: string;
      stationId?: string;
      description: string;
      immediateAction?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.safetyService.createIncident({
      ...body,
      reportedById: user.sub,
    });
  }

  @Patch('incidents/:id')
  @Roles(
    UserRole.SAFETY_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  updateIncident(
    @Param('id') id: string,
    @Body()
    body: {
      status?: IncidentStatus;
      investigatorId?: string;
      rootCause?: string;
      immediateAction?: string;
    },
  ) {
    return this.safetyService.updateIncident(id, body);
  }

  @Get('compliance')
  compliance(@Query('stationId') stationId?: string) {
    return this.safetyService.listCompliance(stationId);
  }

  @Get('compliance/calendar')
  calendar(@Query('daysAhead') daysAhead?: string) {
    return this.safetyService.calendar(Number(daysAhead) || 90);
  }

  @Post('compliance')
  @Roles(
    UserRole.SAFETY_OFFICER,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SYSTEM_ADMIN,
  )
  createCompliance(
    @Body()
    body: {
      title: string;
      type: string;
      stationId?: string;
      issueDate?: string;
      expiryDate: string;
      notes?: string;
      documentRef?: string;
    },
  ) {
    return this.safetyService.createCompliance(body);
  }
}
