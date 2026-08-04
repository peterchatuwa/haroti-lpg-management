import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('test-sms')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DIRECTOR, UserRole.FINANCE_MANAGER)
  testSms(@Body() body: { phone: string; message?: string }) {
    return this.notificationsService.sendSms(
      body.phone,
      body.message ?? 'Haroti LPG ERP test SMS',
    );
  }
}
