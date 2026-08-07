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
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NotificationChannel, UserRole } from '../common/enums';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.listForUser(
      user.sub,
      unreadOnly === 'true',
    );
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markRead(id, user.sub);
  }

  @Get('preferences')
  preferences(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.listPreferences(user.sub);
  }

  @Post('preferences')
  savePreference(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      eventType: string;
      channel: NotificationChannel;
      enabled: boolean;
    },
  ) {
    return this.notificationsService.upsertPreference({
      userId: user.sub,
      ...body,
    });
  }

  @Post('test-sms')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.DIRECTOR, UserRole.FINANCE_MANAGER)
  testSms(@Body() body: { phone: string; message?: string }) {
    return this.notificationsService.sendSms(
      body.phone,
      body.message ?? 'Haroti LPG ERP test SMS',
    );
  }
}
