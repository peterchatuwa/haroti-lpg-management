import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { PaycDashboard } from '../lib/erp-types';
import { formatKg, formatMoney } from '../lib/format';

interface PaycDashboardExtended extends PaycDashboard {
  alerts?: Array<{ meterSerial: string; type: string; message: string }>;
}

interface VendorStatus {
  configured: boolean;
  connected: boolean;
  message?: string;
  areaName?: string;
  vendorMeterPages?: number;
}

interface PaycMeterRow {
  id: string;
  meterSerial: string;
  imei?: string;
  creditBalanceKg: string;
  deferredRevenue: string;
  dailyBurnKg: string;
  status: string;
  location?: string;
  valveOpen?: boolean | null;
  leakageDetected?: boolean;
  tamperDetected?: boolean;
  lowBatteryAlert?: boolean;
  customer?: { fullName: string };
}

export function PaycPage() {
  const queryClient = useQueryClient();

  const { data: vendor } = useQuery({
    queryKey: ['payc-vendor-status'],
    queryFn: async () => (await api.get<VendorStatus>('/payc/vendor/status')).data,
    refetchInterval: 60000,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['payc-dashboard'],
    queryFn: async () =>
      (await api.get<PaycDashboardExtended>('/payc/dashboard')).data,
    refetchInterval: 20000,
  });

  const { data: meters } = useQuery({
    queryKey: ['payc-meters'],
    queryFn: async () => (await api.get<PaycMeterRow[]>('/payc/meters')).data,
    refetchInterval: 30000,
  });

  const importMutation = useMutation({
    mutationFn: async () => (await api.post('/payc/import-vendor')).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payc-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payc-meters'] });
      queryClient.invalidateQueries({ queryKey: ['payc-vendor-status'] });
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => (await api.post('/payc/sync-vendor')).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payc-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payc-meters'] });
    },
  });

  if (!dashboard) return <div className="panel">Loading PAYC platform…</div>;

  return (
    <div className="stack">
      <PageHeader
        title="Pay-As-You-Cook (PAYC)"
        subtitle="Manage Zhongyi smart meters from Haroti ERP — fleet, top-ups, valve control & sync"
        action={
          <div className="pay-chips">
            <button
              type="button"
              className="btn btn-primary"
              disabled={importMutation.isPending || !vendor?.connected}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending ? 'Importing…' : 'Import from Zhongyi'}
            </button>
            <button
              type="button"
              className="btn"
              disabled={syncAllMutation.isPending || !vendor?.connected}
              onClick={() => syncAllMutation.mutate()}
            >
              {syncAllMutation.isPending ? 'Syncing…' : 'Sync all meters'}
            </button>
          </div>
        }
      />

      <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <strong>Zhongyi platform</strong>
          <p className="muted" style={{ margin: '0.25rem 0 0' }}>
            {!vendor?.configured && (vendor?.message ?? 'Not configured')}
            {vendor?.configured && !vendor.connected && (vendor.message ?? 'Not connected')}
            {vendor?.connected &&
              `Connected · ${vendor.areaName ?? 'Area'} · ${vendor.vendorMeterPages ?? '?'} meter(s) on Zhongyi`}
          </p>
        </div>
        <span className={`badge ${vendor?.connected ? '' : 'warn'}`}>
          {vendor?.connected ? 'Vendor online' : 'Vendor offline'}
        </span>
      </div>

      {(importMutation.isSuccess || syncAllMutation.isSuccess) && (
        <p className="panel" style={{ color: 'var(--ok)', margin: 0 }}>
          {importMutation.isSuccess &&
            `Imported ${importMutation.data.imported} meters (${importMutation.data.created} new, ${importMutation.data.updated} updated)`}
          {syncAllMutation.isSuccess &&
            `Synced ${syncAllMutation.data.synced} meter(s) from Zhongyi`}
        </p>
      )}

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Active meters</h3>
          <div className="value">{dashboard.activeMeters}</div>
          <div className="hint">{dashboard.totalMeters} installed</div>
        </div>
        <div className="panel stat-card">
          <h3>Prepaid credit</h3>
          <div className="value">{formatMoney(dashboard.totalDeferredRevenue)}</div>
          <div className="hint">MWK value of gas credit on meters</div>
        </div>
        <div className="panel stat-card">
          <h3>Daily burn</h3>
          <div className="value">{formatKg(dashboard.dailyBurnKg)}</div>
          <div className="hint">
            Est. {formatMoney(dashboard.estimatedDailyRevenue)}/day at Zhongyi prices
          </div>
        </div>
        <div className="panel stat-card warn">
          <h3>Alerts</h3>
          <div className="value">
            {dashboard.lowCreditMeters + dashboard.offlineMeters + (dashboard.valveClosedMeters ?? 0)}
          </div>
          <div className="hint">
            {dashboard.lowCreditMeters} low credit · {dashboard.offlineMeters} offline
            {(dashboard.valveClosedMeters ?? 0) > 0 &&
              ` · ${dashboard.valveClosedMeters} valve closed`}
          </div>
        </div>
      </div>

      {dashboard.alerts && dashboard.alerts.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Active alerts</h3>
          <ul className="alert-list">
            {dashboard.alerts.map((a, i) => (
              <li key={i}>
                <span>{a.meterSerial} — {a.type.replaceAll('_', ' ')}</span>
                <strong>{a.message}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <h3 className="panel-title">Smart meter fleet</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Serial</th>
                <th>IMEI</th>
                <th>Customer</th>
                <th>Location</th>
                <th>Credit (kg)</th>
                <th>Valve</th>
                <th>Safety</th>
                <th>Prepaid (MWK)</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(meters ?? []).map((m) => (
                <tr key={m.id}>
                  <td>{m.meterSerial}</td>
                  <td className="muted">{m.imei ?? '—'}</td>
                  <td>{m.customer?.fullName ?? '—'}</td>
                  <td>{m.location ?? '—'}</td>
                  <td>{formatKg(Number(m.creditBalanceKg))}</td>
                  <td>
                    {m.valveOpen === true
                      ? 'Open'
                      : m.valveOpen === false
                        ? 'Closed'
                        : '—'}
                  </td>
                  <td>
                    {m.leakageDetected || m.tamperDetected || m.lowBatteryAlert ? (
                      <span className="pay-chips" style={{ gap: '0.25rem' }}>
                        {m.leakageDetected && <span className="badge danger">Leak</span>}
                        {m.tamperDetected && <span className="badge danger">Tamper</span>}
                        {m.lowBatteryAlert && <span className="badge warn">Battery</span>}
                      </span>
                    ) : (
                      <span className="muted">OK</span>
                    )}
                  </td>
                  <td>{formatMoney(Number(m.deferredRevenue))}</td>
                  <td>
                    <span className="badge">{m.status.replaceAll('_', ' ')}</span>
                  </td>
                  <td>
                    <Link to={`/payc/${m.id}`} className="btn btn-primary">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!meters?.length && (
          <p className="muted" style={{ marginTop: '1rem' }}>
            No meters yet. Configure Zhongyi credentials on the server, then click{' '}
            <strong>Import from Zhongyi</strong>.
          </p>
        )}
      </div>
    </div>
  );
}
