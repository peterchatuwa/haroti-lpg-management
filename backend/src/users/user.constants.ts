import { UserRole } from '../common/enums';

export const STATION_SCOPED_ROLES = new Set<UserRole>([
  UserRole.STATION_MANAGER,
  UserRole.ATTENDANT,
  UserRole.STOREKEEPER,
]);

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SYSTEM_ADMIN]: 'System admin',
  [UserRole.DIRECTOR]: 'Director',
  [UserRole.OPERATIONS_MANAGER]: 'Operations manager',
  [UserRole.FINANCE_MANAGER]: 'Finance manager',
  [UserRole.STATION_MANAGER]: 'Station manager',
  [UserRole.ATTENDANT]: 'Attendant',
  [UserRole.STOREKEEPER]: 'Storekeeper',
  [UserRole.SAFETY_OFFICER]: 'Safety officer',
  [UserRole.AUDITOR]: 'Auditor',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.SYSTEM_ADMIN]: 'Full system access including staff management',
  [UserRole.DIRECTOR]: 'Network-wide executive access',
  [UserRole.OPERATIONS_MANAGER]: 'Network operations and station oversight',
  [UserRole.FINANCE_MANAGER]: 'Finance, GL, and payment approvals',
  [UserRole.STATION_MANAGER]: 'Single-station management and shift approvals',
  [UserRole.ATTENDANT]: 'POS, shifts, and daily station operations',
  [UserRole.STOREKEEPER]: 'Inventory and stock movements at a station',
  [UserRole.SAFETY_OFFICER]: 'Safety inspections and compliance',
  [UserRole.AUDITOR]: 'Read-only audit and compliance access',
};

/** Roles an operations manager may assign when creating or updating staff. */
export const OPS_MANAGEABLE_ROLES = new Set<UserRole>([
  UserRole.STATION_MANAGER,
  UserRole.ATTENDANT,
  UserRole.STOREKEEPER,
  UserRole.SAFETY_OFFICER,
]);

/** Only system admins may assign this role. */
export const ADMIN_ONLY_ROLES = new Set<UserRole>([UserRole.SYSTEM_ADMIN]);
