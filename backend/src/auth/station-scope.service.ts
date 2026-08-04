import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../common/enums';
import { JwtPayload } from './jwt-payload';

const NETWORK_ROLES = new Set<UserRole>([
  UserRole.SYSTEM_ADMIN,
  UserRole.DIRECTOR,
  UserRole.OPERATIONS_MANAGER,
  UserRole.FINANCE_MANAGER,
  UserRole.AUDITOR,
]);

@Injectable()
export class StationScopeService {
  isNetworkWide(role: UserRole): boolean {
    return NETWORK_ROLES.has(role);
  }

  /** Returns the station filter the caller may use (undefined = all stations). */
  resolveStationFilter(
    user: JwtPayload,
    requestedStationId?: string,
  ): string | undefined {
    if (this.isNetworkWide(user.role)) {
      return requestedStationId;
    }
    if (!user.stationId) {
      throw new ForbiddenException('User is not assigned to a station');
    }
    if (requestedStationId && requestedStationId !== user.stationId) {
      throw new ForbiddenException('Access denied for this station');
    }
    return user.stationId;
  }

  assertStationAccess(user: JwtPayload, stationId: string): void {
    if (this.isNetworkWide(user.role)) return;
    if (user.stationId !== stationId) {
      throw new ForbiddenException('Access denied for this station');
    }
  }
}
