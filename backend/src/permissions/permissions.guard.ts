import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../auth/jwt-payload';
import { PermissionsService } from './permissions.service';
import { PERMISSIONS_KEY } from './require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const allowed = await this.permissionsService.hasAny(
      request.user.role,
      required,
    );
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
