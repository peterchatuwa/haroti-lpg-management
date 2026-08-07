import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';

export function ExecutivePage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['executive-overview'],
    queryFn: async () => (await api.get('/executive/overview')).data,
  });

  const { data: rankings } = useQuery({
    queryKey: ['executive-rankings'],
    queryFn: async () => (await api.get('/executive/station-rankings')).data,
  });

  if (isLoading || !overview) {
    return <div className="panel">Loading executive cockpit…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Executive cockpit"
        subtitle="Network KPIs, rankings and operational alerts"
      />

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Month revenue</h3>
          <div className="value">{formatMoney(overview.totalRevenueMonth)}</div>
        </div>
        <div className="panel stat-card">
          <h3>LPG sold (kg)</h3>
          <div className="value">{overview.totalKgMonth?.toFixed?.(0) ?? overview.totalKgMonth}</div>
        </div>
        <div className="panel stat-card">
          <h3>Margin / kg</h3>
          <div className="value">{formatMoney(overview.grossMarginPerKg)}</div>
        </div>
        <div className="panel stat-card">
          <h3>Action items</h3>
          <div className="value">{overview.actionCentre?.total ?? 0}</div>
        </div>
        <div className="panel stat-card warn">
          <h3>Stockout risk (≤3 days)</h3>
          <div className="value">{overview.stockoutRisk ?? 0}</div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Station rankings (revenue)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Station</th>
                <th>Revenue</th>
                <th>kg</th>
                <th>Avg ticket</th>
                <th>Margin/kg</th>
              </tr>
            </thead>
            <tbody>
              {(rankings?.rankings ?? []).map(
                (r: {
                  code: string;
                  revenue: number;
                  kg: number;
                  avgTicket: number;
                  marginPerKg: number;
                }, i: number) => (
                  <tr key={r.code}>
                    <td>{i + 1}</td>
                    <td>{r.code}</td>
                    <td>{formatMoney(r.revenue)}</td>
                    <td>{r.kg}</td>
                    <td>{formatMoney(r.avgTicket)}</td>
                    <td>{formatMoney(r.marginPerKg)}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(overview.targetProgress ?? []).length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Target achievement (this month)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Scope</th>
                  <th>Metric</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {overview.targetProgress.map(
                  (t: {
                    id: string;
                    stationCode?: string;
                    metric: string;
                    target: number;
                    actual: number;
                    achievementPct: number;
                  }) => (
                    <tr key={t.id}>
                      <td>{t.stationCode ?? 'Network'}</td>
                      <td>{t.metric}</td>
                      <td>{formatMoney(t.target)}</td>
                      <td>{formatMoney(t.actual)}</td>
                      <td>{t.achievementPct}%</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(overview.runoutAlerts ?? []).length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Runout alerts</h3>
          <ul>
            {overview.runoutAlerts.map(
              (a: { stationCode: string; daysToRunout: number; currentStockKg: number }) => (
                <li key={a.stationCode}>
                  {a.stationCode}: {a.currentStockKg} kg — ~{a.daysToRunout} days left
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
