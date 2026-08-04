import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AccessoriesPage } from './pages/AccessoriesPage';
import { CylindersPage } from './pages/CylindersPage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { PaycPage } from './pages/PaycPage';
import { PosPage } from './pages/PosPage';
import { ProcurementPage } from './pages/ProcurementPage';
import { ReportsPage } from './pages/ReportsPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { StationsPage } from './pages/StationsPage';
import { TransfersPage } from './pages/TransfersPage';
import api from './lib/api';
import { useAuthStore } from './store/auth';
import { useOfflineStore } from './store/offline';

function Protected({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const setOnline = useOfflineStore((s) => s.setOnline);
  const loadOffline = useOfflineStore((s) => s.load);
  const queue = useOfflineStore((s) => s.queue);
  const markSynced = useOfflineStore((s) => s.markSynced);
  const online = useOfflineStore((s) => s.online);

  useEffect(() => {
    hydrate();
    loadOffline();
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [hydrate, loadOffline, setOnline]);

  useEffect(() => {
    if (!online) return;
    const pending = queue.filter((q) => !q.synced);
    pending.forEach(async (item) => {
      try {
        await api.post('/sales', item.payload);
        markSynced(item.clientTxnId);
      } catch {
        // keep in queue for next retry
      }
    });
  }, [online, queue, markSynced]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="accessories" element={<AccessoriesPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="cylinders" element={<CylindersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="payc" element={<PaycPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="stations" element={<StationsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
