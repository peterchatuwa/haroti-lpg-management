import {
  ArrowLeftRight,
  Gauge,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  ShoppingCart,
  Tag,
  Truck,
  Wallet,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useOfflineStore } from '../store/offline';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pos', label: 'Refill POS', icon: ShoppingCart },
  { to: '/shifts', label: 'Shifts', icon: Gauge },
  { to: '/inventory', label: 'LPG Stock', icon: Package },
  { to: '/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
  { to: '/cylinders', label: 'Cylinders', icon: Tag },
  { to: '/expenses', label: 'Cash & Expenses', icon: Wallet },
  { to: '/stations', label: 'Stations', icon: Receipt },
];

export function Layout() {
  const { user, clearSession } = useAuthStore();
  const online = useOfflineStore((s) => s.online);
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">H</div>
          <h1>Haroti Holdings</h1>
          <p>LPG Management</p>
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
              : 'All stations'}
          </small>
          <div className="row" style={{ marginTop: '0.8rem' }}>
            <button
              className="btn btn-ghost"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
              onClick={() => {
                clearSession();
                navigate('/login');
              }}
            >
              <LogOut size={16} style={{ marginRight: 6 }} />
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div />
          <div
            className={`status-pill ${online ? '' : 'offline'}`}
            title={online ? 'Connected' : 'Working offline'}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: 'currentColor',
              }}
            />
            {online ? 'Online' : 'Offline mode'}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
