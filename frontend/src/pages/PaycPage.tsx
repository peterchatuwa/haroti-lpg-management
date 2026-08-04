import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { PaycDashboard } from '../lib/erp-types';
import { formatKg, formatMoney } from '../lib/format';

interface PaycDashboardExtended extends PaycDashboard {
  alerts?: Array<{ meterSerial: string; type: string; message: string }>;
}

export function PaycPage() {
  const { data } = useQuery({
    queryKey: ['payc-dashboard'],
    queryFn: async () =>
      (await api.get<PaycDashboardExtended>('/payc/dashboard')).data,
    refetchInterval: 20000,
  });

  if (!data) return <div className="panel">Loading PAYC platform…</div>;

  return (
    <div className="stack">
      <PageHeader
        title="Pay-As-You-Cook (PAYC)"
        subtitle="IoT smart metering, telemetry ingest, credit top-up & offline detection (Phase 2)"
      />

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Active meters</h3>
          <div className="value">{data.activeMeters}</div>
          <div className="hint">{data.totalMeters} installed</div>
        </div>
        <div className="panel stat-card">
          <h3>Deferred revenue</h3>
          <div className="value">{formatMoney(data.totalDeferredRevenue)}</div>
          <div className="hint">Prepaid credit liability</div>
        </div>
        <div className="panel stat-card">
          <h3>Daily burn</h3>
          <div className="value">{formatKg(data.dailyBurnKg)}</div>
          <div className="hint">Est. {formatMoney(data.estimatedDailyRevenue)}/day</div>
        </div>
        <div className="panel stat-card warn">
          <h3>Alerts</h3>
          <div className="value">{data.lowCreditMeters + data.offlineMeters}</div>
          <div className="hint">
            {data.lowCreditMeters} low credit · {data.offlineMeters} offline
          </div>
        </div>
      </div>

      {data.alerts && data.alerts.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Active alerts</h3>
          <ul className="alert-list">
            {data.alerts.map((a, i) => (
              <li key={i}>
                <span>
                  {a.meterSerial} — {a.type.replaceAll('_', ' ')}
                </span>
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
                <th>Customer</th>
                <th>Location</th>
                <th>Credit (kg)</th>
                <th>Deferred MWK</th>
                <th>Daily burn</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.meters.map((m) => (
                <tr key={m.id}>
                  <td>{m.meterSerial}</td>
                  <td>{m.customer?.fullName ?? '—'}</td>
                  <td>{m.location ?? '—'}</td>
                  <td>{formatKg(Number(m.creditBalanceKg))}</td>
                  <td>{formatMoney(Number(m.deferredRevenue))}</td>
                  <td>{formatKg(Number(m.dailyBurnKg))}</td>
                  <td>
                    <span className="badge">{m.status.replaceAll('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
