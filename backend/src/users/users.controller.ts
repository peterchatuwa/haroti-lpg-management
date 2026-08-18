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
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/require-permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @RequirePermissions('staff.view')
  @Get('roles')
  listRoles() {
    return this.usersService.listRoles();
  }

  @RequirePermissions('staff.view')
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('stationId') stationId?: string,
  ) {
    return this.usersService.findAll(user, stationId);
  }

  @RequirePermissions('staff.view')
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.findOne(user, id);
  }

  @RequirePermissions('staff.create')
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserDto) {
    return this.usersService.create(user, dto);
  }

  @RequirePermissions('staff.invite')
  @Post(':id/invite')
  resendInvite(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.resendInvite(user, id);
  }

  @RequirePermissions('staff.edit')
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user, id, dto);
  }
}
