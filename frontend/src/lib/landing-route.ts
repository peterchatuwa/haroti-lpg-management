import type { AuthUser } from './types';

/** Role-based default landing after login (spec UX-004). */
export function landingRouteForRole(role: AuthUser['role']): string {
  switch (role) {
    case 'SYSTEM_ADMIN':
    case 'DIRECTOR':
      return '/executive';
    case 'OPERATIONS_MANAGER':
      return '/action-centre';
    case 'STATION_MANAGER':
    case 'ATTENDANT':
      return '/pos';
    case 'FINANCE_MANAGER':
      return '/finance';
    default:
      return '/';
  }
}
