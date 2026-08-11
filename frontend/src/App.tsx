import { useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AccessoriesPage } from './pages/AccessoriesPage';
import { CylindersPage } from './pages/CylindersPage';
import { CustomerStatementPage } from './pages/CustomerStatementPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
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
import { ActionCentrePage } from './pages/ActionCentrePage';
import { ExecutivePage } from './pages/ExecutivePage';
import { FinancePage } from './pages/FinancePage';
import { TargetsPage } from './pages/TargetsPage';
import { NetworkMapPage } from './pages/NetworkMapPage';
import { SafetyPage } from './pages/SafetyPage';
import { ApprovalInboxPage } from './pages/ApprovalInboxPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { StaffAnalyticsPage } from './pages/StaffAnalyticsPage';
import { StaffPage } from './pages/StaffPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { InsightsPage } from './pages/InsightsPage';
import { LoyaltyPage } from './pages/LoyaltyPage';
import { RefillRequestsPage } from './pages/RefillRequestsPage';
import { SyncCentrePage } from './pages/SyncCentrePage';
import { FranchisePage } from './pages/FranchisePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ReportsPage } from './pages/ReportsPage';
import { RequisitionsPage } from './pages/RequisitionsPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { StationOverviewPage } from './pages/StationOverviewPage';
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
  const markConflict = useOfflineStore((s) => s.markConflict);
  const markFailed = useOfflineStore((s) => s.markFailed);
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
    const pending = queue.filter((q) => !q.synced && !q.conflict);
    pending.forEach(async (item) => {
      try {
        await api.post('/sales', item.payload);
        markSynced(item.clientTxnId);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number; data?: { message?: string } } })
          ?.response?.status;
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? 'Sync failed';
        if (status === 409) {
          markConflict(item.clientTxnId, message);
        } else {
          markFailed(item.clientTxnId, message);
        }
      }
    });
  }, [online, queue, markSynced, markConflict, markFailed]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route path="/portal" element={<CustomerPortalPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="executive" element={<ExecutivePage />} />
        <Route path="action-centre" element={<ActionCentrePage />} />
        <Route path="approval-inbox" element={<ApprovalInboxPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="staff-analytics" element={<StaffAnalyticsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="loyalty" element={<LoyaltyPage />} />
        <Route path="refill-requests" element={<RefillRequestsPage />} />
        <Route path="targets" element={<TargetsPage />} />
        <Route path="sync-centre" element={<SyncCentrePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="accessories" element={<AccessoriesPage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="network" element={<NetworkMapPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="requisitions" element={<RequisitionsPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="cylinders" element={<CylindersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id/statement" element={<CustomerStatementPage />} />
        <Route path="customers/:id" element={<CustomerProfilePage />} />
        <Route path="payc" element={<PaycPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="safety" element={<SafetyPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="franchise" element={<FranchisePage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="stations" element={<StationsPage />} />
        <Route path="stations/:id" element={<StationOverviewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
