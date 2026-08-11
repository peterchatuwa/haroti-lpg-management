import {
  LogOut,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useClock } from '../hooks/useClock';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useOfflineStore } from '../store/offline';
import { FlameMark } from './FlameMark';
import { GlobalSearch } from './GlobalSearch';
import { SidebarNav } from './SidebarNav';

export function Layout() {
  const { user, clearSession } = useAuthStore();
  const online = useOfflineStore((s) => s.online);
  const pending = useOfflineStore((s) =>
    s.queue.filter((q) => !q.synced && !q.conflict).length,
  );
  const conflicts = useOfflineStore((s) =>
    s.queue.filter((q) => q.conflict).length,
  );
  const navigate = useNavigate();
  const now = useClock();

  const { data: reqSummary } = useQuery({
    queryKey: ['requisitions-summary'],
    queryFn: async () =>
      (await api.get<{ pendingGmApproval: number; readyToPay: number }>(
        '/requisitions/pending-summary',
      )).data,
    refetchInterval: 30000,
  });

  const isGm =
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'OPERATIONS_MANAGER';
  const isFinance =
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'FINANCE_MANAGER';

  const isStaffAdmin = user?.permissions?.some((p) =>
    ['staff.view', 'staff.create', 'staff.edit'].includes(p),
  );

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
        <SidebarNav isStaffAdmin={!!isStaffAdmin} />
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
          <GlobalSearch />
          <div className="main-top-right">
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
            {isGm && (reqSummary?.pendingGmApproval ?? 0) > 0 && (
              <NavLink to="/requisitions" className="badge warn">
                {reqSummary?.pendingGmApproval} req. pending
              </NavLink>
            )}
            {isFinance && (reqSummary?.readyToPay ?? 0) > 0 && (
              <NavLink to="/requisitions" className="badge ok">
                {reqSummary?.readyToPay} ready to pay
              </NavLink>
            )}
            {pending > 0 && (
              <span className="badge warn">{pending} queued offline</span>
            )}
            {conflicts > 0 && (
              <NavLink to="/sync-centre" className="badge warn">
                {conflicts} sync conflict{conflicts > 1 ? 's' : ''}
              </NavLink>
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
        </div>
        <Outlet />
      </main>
    </div>
  );
}
