import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload';
import { UserRole } from '../common/enums';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from './permissions.service';
import { RequirePermissions } from './require-permissions.decorator';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('me')
  myPermissions(@CurrentUser() user: JwtPayload) {
    return this.permissionsService.getPermissionsForRole(user.role);
  }

  @RequirePermissions('security.role.manage')
  @Get()
  listAll() {
    return this.permissionsService.listPermissions();
  }

  @RequirePermissions('security.role.manage')
  @Get('roles')
  listRoleBundles() {
    return this.permissionsService.listRoleBundles();
  }

  @RequirePermissions('security.role.manage')
  @Get('roles/:role')
  getRolePermissions(@Param('role') role: UserRole) {
    return this.permissionsService.getRolePermissions(role);
  }

  @RequirePermissions('security.role.manage')
  @Patch('roles/:role')
  updateRolePermissions(
    @Param('role') role: UserRole,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.permissionsService.updateRolePermissions(role, dto.permissions);
  }
}
