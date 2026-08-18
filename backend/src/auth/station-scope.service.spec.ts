import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../common/enums';
import { JwtPayload } from './jwt-payload';
import { StationScopeService } from './station-scope.service';

describe('StationScopeService', () => {
  const service = new StationScopeService();

  const attendant: JwtPayload = {
    sub: 'u1',
    username: 'att1',
    role: UserRole.ATTENDANT,
    stationId: 'station-a',
    fullName: 'Attendant',
  };

  const admin: JwtPayload = {
    sub: 'u2',
    username: 'admin',
    role: UserRole.SYSTEM_ADMIN,
    stationId: null,
    fullName: 'Admin',
  };

  it('allows network roles to query any station', () => {
    expect(service.resolveStationFilter(admin, 'station-b')).toBe('station-b');
    expect(service.resolveStationFilter(admin)).toBeUndefined();
  });

  it('restricts attendants to their assigned station', () => {
    expect(service.resolveStationFilter(attendant)).toBe('station-a');
  });

  it('denies cross-station access for attendants (AC-09)', () => {
    expect(() => service.resolveStationFilter(attendant, 'station-b')).toThrow(
      ForbiddenException,
    );
    expect(() => service.assertStationAccess(attendant, 'station-b')).toThrow(
      ForbiddenException,
    );
  });
});
