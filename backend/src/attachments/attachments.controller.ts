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
import { AttachmentEntityType, UserRole } from '../common/enums';
import { AttachmentsService } from './attachments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  list(
    @Query('entityType') entityType: AttachmentEntityType,
    @Query('entityId') entityId: string,
  ) {
    return this.attachmentsService.list(entityType, entityId);
  }

  @Post()
  @Roles(
    UserRole.SYSTEM_ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.STOREKEEPER,
    UserRole.STATION_MANAGER,
  )
  upload(
    @Body()
    body: {
      entityType: AttachmentEntityType;
      entityId: string;
      fileName: string;
      mimeType: string;
      dataBase64: string;
      description?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.attachmentsService.upload({
      ...body,
      uploadedById: user.sub,
    });
  }

  @Get(':id/download')
  download(@Param('id') id: string) {
    return this.attachmentsService.download(id);
  }
}
