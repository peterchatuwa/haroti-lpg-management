import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  Gift,
  Handshake,
  Inbox,
  LayoutDashboard,
  Map,
  Package,
  Radio,
  Receipt,
  RefreshCw,
  Shield,
  ShoppingCart,
  Sparkles,
  Tag,
  Target,
  Truck,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { UserRole } from '../lib/types';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Visible to these roles. Omit = all roles. Admins/directors always see all. */
  roles?: UserRole[];
  adminOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavSection = {
  id: string;
  label: string;
  groups: NavGroup[];
};

/** Role bundles for nav visibility */
const NET: UserRole[] = [
  'SYSTEM_ADMIN',
  'DIRECTOR',
  'OPERATIONS_MANAGER',
  'FINANCE_MANAGER',
  'AUDITOR',
];
const STATION: UserRole[] = [
  'STATION_MANAGER',
  'ATTENDANT',
  'STOREKEEPER',
  'SAFETY_OFFICER',
];
const FLOOR: UserRole[] = ['STATION_MANAGER', 'ATTENDANT'];
const STOCK: UserRole[] = ['STATION_MANAGER', 'STOREKEEPER'];
const EXEC: UserRole[] = ['SYSTEM_ADMIN', 'DIRECTOR', 'OPERATIONS_MANAGER'];
const FINANCE: UserRole[] = ['SYSTEM_ADMIN', 'DIRECTOR', 'FINANCE_MANAGER', 'AUDITOR'];

function vis(...groups: UserRole[][]): UserRole[] {
  return [...new Set(groups.flat())];
}

export const navSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    groups: [
      {
        label: 'Home',
        items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
      },
    ],
  },
  {
    id: 'executive',
    label: 'Executive',
    groups: [
      {
        label: 'Cockpit',
        items: [
          { to: '/executive', label: 'Executive cockpit', icon: BarChart3, roles: vis(EXEC, FINANCE) },
          { to: '/reports', label: 'Executive BI', icon: BarChart3, roles: vis(EXEC, FINANCE) },
          { to: '/targets', label: 'Targets', icon: Target, roles: EXEC },
        ],
      },
      {
        label: 'Workflows',
        items: [
          { to: '/action-centre', label: 'Action centre', icon: Inbox, roles: vis(EXEC, ['STATION_MANAGER']) },
          {
            to: '/approval-inbox',
            label: 'Approval inbox',
            icon: ClipboardCheck,
            roles: vis(EXEC, ['STATION_MANAGER', 'FINANCE_MANAGER']),
          },
          { to: '/insights', label: 'AI insights', icon: Sparkles, roles: EXEC },
        ],
      },
    ],
  },
  {
    id: 'station',
    label: 'Station operations',
    groups: [
      {
        label: 'Daily operations',
        items: [
          { to: '/pos', label: 'Refill POS', icon: ShoppingCart, roles: vis(FLOOR, NET) },
          { to: '/shifts', label: 'Shifts', icon: Gauge, roles: vis(FLOOR, STOCK, NET) },
          { to: '/accessories', label: 'Accessories', icon: Tag, roles: vis(FLOOR, NET) },
          { to: '/products', label: 'Products', icon: Package, roles: vis(STOCK, FLOOR, NET) },
          { to: '/sync-centre', label: 'Sync centre', icon: RefreshCw, roles: vis(FLOOR, NET) },
        ],
      },
      {
        label: 'Stock & assets',
        items: [
          { to: '/inventory', label: 'LPG Stock', icon: Package, roles: vis(STOCK, FLOOR, NET) },
          { to: '/cylinders', label: 'Cylinders', icon: Tag, roles: vis(STOCK, FLOOR, NET) },
        ],
      },
    ],
  },
  {
    id: 'supply',
    label: 'Supply chain',
    groups: [
      {
        label: 'Inbound',
        items: [
          { to: '/deliveries', label: 'Deliveries', icon: Truck, roles: vis(STOCK, ['STATION_MANAGER'], NET) },
          { to: '/procurement', label: 'Procurement', icon: Receipt, roles: vis(NET) },
          {
            to: '/requisitions',
            label: 'Requisitions',
            icon: ClipboardList,
            roles: vis(NET, ['STATION_MANAGER']),
          },
        ],
      },
      {
        label: 'Movement',
        items: [
          { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: vis(STOCK, ['STATION_MANAGER'], NET) },
        ],
      },
    ],
  },
  {
    id: 'commercial',
    label: 'Commercial',
    groups: [
      {
        label: 'Customers',
        items: [
          { to: '/customers', label: 'Customers', icon: Users, roles: vis(FLOOR, NET) },
          { to: '/loyalty', label: 'Loyalty', icon: Gift, roles: vis(FLOOR, NET) },
          { to: '/refill-requests', label: 'Refill requests', icon: Truck, roles: vis(FLOOR, NET) },
        ],
      },
      {
        label: 'Smart LPG',
        items: [{ to: '/payc', label: 'PAYC IoT', icon: Radio, roles: vis(NET, ['STATION_MANAGER']) }],
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    groups: [
      {
        label: 'Accounting',
        items: [
          {
            to: '/expenses',
            label: 'Cash & Expenses',
            icon: Wallet,
            roles: vis(FLOOR, STOCK, ['STATION_MANAGER'], NET),
          },
          { to: '/finance', label: 'Finance & GL', icon: Calculator, roles: FINANCE },
        ],
      },
    ],
  },
  {
    id: 'network',
    label: 'Network & growth',
    groups: [
      {
        label: 'Locations',
        items: [
          { to: '/network', label: 'Network map', icon: Map, roles: NET },
          { to: '/stations', label: 'Stations', icon: Receipt, roles: vis(NET, ['STATION_MANAGER', 'SAFETY_OFFICER']) },
        ],
      },
      {
        label: 'Expansion',
        items: [
          { to: '/franchise', label: 'Franchise', icon: Handshake, roles: NET },
          { to: '/projects', label: 'Capital projects', icon: Building2, roles: NET },
        ],
      },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    groups: [
      {
        label: 'Safety & maintenance',
        items: [
          { to: '/maintenance', label: 'CMMS', icon: Wrench, roles: vis(NET, ['STATION_MANAGER', 'SAFETY_OFFICER']) },
          { to: '/safety', label: 'Safety', icon: Shield, roles: vis(NET, STATION) },
        ],
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    groups: [
      {
        label: 'Staff',
        items: [
          {
            to: '/staff-analytics',
            label: 'Staff analytics',
            icon: UsersRound,
            roles: vis(EXEC, ['STATION_MANAGER']),
          },
          {
            to: '/staff',
            label: 'Staff & roles',
            icon: UserCog,
            adminOnly: true,
          },
        ],
      },
      {
        label: 'Alerts',
        items: [{ to: '/notifications', label: 'Notifications', icon: Bell }],
      },
    ],
  },
];

function canSeeItem(
  item: NavItem,
  role: UserRole,
  isStaffAdmin: boolean,
): boolean {
  if (item.adminOnly && !isStaffAdmin) return false;
  if (role === 'SYSTEM_ADMIN' || role === 'DIRECTOR') return true;
  if (!item.roles) return true;
  return item.roles.includes(role);
}

export function filterNavSections(
  sections: NavSection[],
  role: UserRole,
  isStaffAdmin: boolean,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => canSeeItem(item, role, isStaffAdmin)),
        }))
        .filter((group) => group.items.length > 0),
    }))
    .filter((section) => section.groups.length > 0);
}

export function findSectionForPath(pathname: string, sections: NavSection[]) {
  for (const section of sections) {
    for (const group of section.groups) {
      if (
        group.items.some(
          (item) =>
            item.to === pathname ||
            (item.to !== '/' && pathname.startsWith(item.to)),
        )
      ) {
        return section.id;
      }
    }
  }
  return 'overview';
}

export function isPathAllowed(
  pathname: string,
  role: UserRole,
  isStaffAdmin: boolean,
): boolean {
  const sections = filterNavSections(navSections, role, isStaffAdmin);
  return sections.some((section) =>
    section.groups.some((group) =>
      group.items.some((item) => {
        if (item.to === '/') return pathname === '/';
        return pathname === item.to || pathname.startsWith(`${item.to}/`);
      }),
    ),
  );
}

/** Sections a role typically uses — expanded by default on first load. */
export function defaultExpandedSections(role: UserRole): string[] {
  switch (role) {
    case 'ATTENDANT':
      return ['overview', 'station', 'commercial'];
    case 'STATION_MANAGER':
      return ['overview', 'station', 'supply', 'commercial'];
    case 'STOREKEEPER':
      return ['overview', 'station', 'supply'];
    case 'FINANCE_MANAGER':
      return ['overview', 'finance', 'executive', 'supply'];
    case 'OPERATIONS_MANAGER':
      return ['overview', 'executive', 'station', 'network'];
    case 'SAFETY_OFFICER':
      return ['overview', 'compliance', 'network'];
    case 'AUDITOR':
      return ['overview', 'finance', 'executive'];
    default:
      return ['overview', 'executive'];
  }
}
