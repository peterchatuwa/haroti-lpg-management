import { UserRole } from '../common/enums';

export interface PermissionDefinition {
  key: string;
  description: string;
  category: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { key: 'sale.create', description: 'Create POS sale', category: 'Sales' },
  { key: 'sale.discount.override', description: 'Approve excess discount', category: 'Sales' },
  { key: 'sale.refund.request', description: 'Request refund', category: 'Sales' },
  { key: 'sale.refund.approve', description: 'Approve refund', category: 'Sales' },
  { key: 'shift.close', description: 'Close own shift', category: 'Operations' },
  { key: 'shift.approve', description: 'Approve another user shift', category: 'Operations' },
  { key: 'stock.adjust.request', description: 'Request stock adjustment', category: 'Inventory' },
  { key: 'stock.adjust.approve', description: 'Approve stock adjustment', category: 'Inventory' },
  { key: 'loss.manage', description: 'Investigate and close loss case', category: 'Inventory' },
  { key: 'finance.journal.view', description: 'View journal entries', category: 'Finance' },
  { key: 'finance.journal.manual.create', description: 'Create manual journal', category: 'Finance' },
  { key: 'finance.period.close', description: 'Close fiscal period', category: 'Finance' },
  { key: 'finance.period.reopen', description: 'Reopen fiscal period', category: 'Finance' },
  { key: 'bank.reconcile', description: 'Perform bank reconciliation', category: 'Finance' },
  { key: 'supplier.create', description: 'Create supplier', category: 'Procurement' },
  { key: 'supplier.bank.edit', description: 'Edit supplier bank details', category: 'Procurement' },
  { key: 'procurement.approve', description: 'Approve procurement within workflow', category: 'Procurement' },
  { key: 'payment.execute', description: 'Record or execute supplier payment', category: 'Finance' },
  { key: 'cylinder.override.compliance', description: 'Override cylinder compliance block', category: 'Safety' },
  { key: 'incident.manage', description: 'Manage safety incident', category: 'Safety' },
  { key: 'audit.export', description: 'Export audit data', category: 'Security' },
  { key: 'staff.view', description: 'View staff register', category: 'Staff' },
  { key: 'staff.create', description: 'Create staff accounts', category: 'Staff' },
  { key: 'staff.edit', description: 'Edit staff accounts', category: 'Staff' },
  { key: 'staff.invite', description: 'Send and resend staff email invites', category: 'Staff' },
  { key: 'security.role.manage', description: 'Manage role permission bundles', category: 'Security' },
];

const ALL_KEYS = PERMISSION_DEFINITIONS.map((p) => p.key);

const opsBundle = [
  'sale.create',
  'sale.discount.override',
  'sale.refund.request',
  'sale.refund.approve',
  'shift.close',
  'shift.approve',
  'stock.adjust.request',
  'stock.adjust.approve',
  'loss.manage',
  'incident.manage',
  'staff.view',
  'staff.create',
  'staff.edit',
  'staff.invite',
];

const financeBundle = [
  'finance.journal.view',
  'finance.journal.manual.create',
  'finance.period.close',
  'finance.period.reopen',
  'bank.reconcile',
  'payment.execute',
  'procurement.approve',
  'supplier.create',
  'audit.export',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SYSTEM_ADMIN]: ALL_KEYS,
  [UserRole.DIRECTOR]: ALL_KEYS.filter((k) => k !== 'security.role.manage'),
  [UserRole.OPERATIONS_MANAGER]: opsBundle,
  [UserRole.FINANCE_MANAGER]: financeBundle,
  [UserRole.STATION_MANAGER]: [
    'sale.create',
    'sale.discount.override',
    'sale.refund.request',
    'shift.close',
    'shift.approve',
    'stock.adjust.request',
    'incident.manage',
  ],
  [UserRole.ATTENDANT]: ['sale.create', 'shift.close'],
  [UserRole.STOREKEEPER]: ['stock.adjust.request', 'loss.manage'],
  [UserRole.SAFETY_OFFICER]: ['incident.manage', 'cylinder.override.compliance', 'loss.manage'],
  [UserRole.AUDITOR]: ['finance.journal.view', 'audit.export'],
};
