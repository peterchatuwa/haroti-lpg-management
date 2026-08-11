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

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
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
          { to: '/executive', label: 'Executive cockpit', icon: BarChart3 },
          { to: '/reports', label: 'Executive BI', icon: BarChart3 },
          { to: '/targets', label: 'Targets', icon: Target },
        ],
      },
      {
        label: 'Workflows',
        items: [
          { to: '/action-centre', label: 'Action centre', icon: Inbox },
          { to: '/approval-inbox', label: 'Approval inbox', icon: ClipboardCheck },
          { to: '/insights', label: 'AI insights', icon: Sparkles },
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
          { to: '/pos', label: 'Refill POS', icon: ShoppingCart },
          { to: '/shifts', label: 'Shifts', icon: Gauge },
          { to: '/accessories', label: 'Accessories', icon: Tag },
          { to: '/sync-centre', label: 'Sync centre', icon: RefreshCw },
        ],
      },
      {
        label: 'Stock & assets',
        items: [
          { to: '/inventory', label: 'LPG Stock', icon: Package },
          { to: '/cylinders', label: 'Cylinders', icon: Tag },
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
          { to: '/deliveries', label: 'Deliveries', icon: Truck },
          { to: '/procurement', label: 'Procurement', icon: Receipt },
          { to: '/requisitions', label: 'Requisitions', icon: ClipboardList },
        ],
      },
      {
        label: 'Movement',
        items: [{ to: '/transfers', label: 'Transfers', icon: ArrowLeftRight }],
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
          { to: '/customers', label: 'Customers', icon: Users },
          { to: '/loyalty', label: 'Loyalty', icon: Gift },
          { to: '/refill-requests', label: 'Refill requests', icon: Truck },
        ],
      },
      {
        label: 'Smart LPG',
        items: [{ to: '/payc', label: 'PAYC IoT', icon: Radio }],
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
          { to: '/expenses', label: 'Cash & Expenses', icon: Wallet },
          { to: '/finance', label: 'Finance & GL', icon: Calculator },
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
          { to: '/network', label: 'Network map', icon: Map },
          { to: '/stations', label: 'Stations', icon: Receipt },
        ],
      },
      {
        label: 'Expansion',
        items: [
          { to: '/franchise', label: 'Franchise', icon: Handshake },
          { to: '/projects', label: 'Capital projects', icon: Building2 },
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
          { to: '/maintenance', label: 'CMMS', icon: Wrench },
          { to: '/safety', label: 'Safety', icon: Shield },
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
          { to: '/staff-analytics', label: 'Staff analytics', icon: UsersRound },
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

export function filterNavSections(
  sections: NavSection[],
  isStaffAdmin: boolean,
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      groups: section.groups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) => !item.adminOnly || isStaffAdmin,
          ),
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
