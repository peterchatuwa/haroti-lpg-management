import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  Gauge,
  Handshake,
  LayoutDashboard,
  LogOut,
  Package,
  Radio,
  Receipt,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useClock } from '../hooks/useClock';
import { useAuthStore } from '../store/auth';
import { useOfflineStore } from '../store/offline';
import { FlameMark } from './FlameMark';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/reports', label: 'Executive BI', icon: BarChart3 },
  { to: '/pos', label: 'Refill POS', icon: ShoppingCart },
  { to: '/accessories', label: 'Accessories', icon: Tag },
  { to: '/shifts', label: 'Shifts', icon: Gauge },
  { to: '/inventory', label: 'LPG Stock', icon: Package },
  { to: '/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/procurement', label: 'Procurement', icon: Receipt },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { to: '/cylinders', label: 'Cylinders', icon: Tag },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/payc', label: 'PAYC IoT', icon: Radio },
  { to: '/maintenance', label: 'CMMS', icon: Wrench },
  { to: '/projects', label: 'Capital projects', icon: Building2 },
  { to: '/franchise', label: 'Franchise', icon: Handshake },
  { to: '/expenses', label: 'Cash & Expenses', icon: Wallet },
  { to: '/stations', label: 'Stations', icon: Receipt },
];

export function Layout() {
  const { user, clearSession } = useAuthStore();
  const online = useOfflineStore((s) => s.online);
  const pending = useOfflineStore((s) => s.queue.filter((q) => !q.synced).length);
  const navigate = useNavigate();
  const now = useClock();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-row">
            <FlameMark size={46} />
            <div>
              <h1>Haroti Gas</h1>
              <p>Enterprise ERP</p>
            </div>
          </div>
        </div>
        <nav className="nav-links">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="user-card">
          <strong>{user?.fullName}</strong>
          <span>{user?.role.replaceAll('_', ' ')}</span>
          <small>
            {user?.station
              ? `${user.station.code} · ${user.station.name}`
              : 'Network-wide access'}
          </small>
          <div className="row" style={{ marginTop: '0.85rem' }}>
            <button
              className="btn btn-ghost"
              style={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.2)',
                width: '100%',
              }}
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
            >
              <LogOut size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="main-top">
          <div className="clock-chip">
            <strong>
              {now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </strong>
            <span>
              {now.toLocaleDateString([], {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="row">
            {pending > 0 && (
              <span className="badge warn">{pending} queued offline</span>
            )}
            <div
              className={`status-pill ${online ? '' : 'offline'}`}
              title={online ? 'Connected' : 'Working offline'}
            >
              <span className="dot" />
              {online ? 'Online' : 'Offline mode'}
            </div>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
