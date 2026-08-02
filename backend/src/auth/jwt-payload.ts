import { UserRole } from '../common/enums';

export class JwtPayload {
  sub!: string;
  username!: string;
  role!: UserRole;
  stationId?: string | null;
  fullName!: string;
}
