import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type {
  CashFlowForecast,
  ExecutiveReport,
  RevenueTrendPoint,
  StationProfitRow,
} from '../lib/erp-types';
import { formatKg, formatMoney } from '../lib/format';

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'ok',
  PARTIAL: 'warn',
  INTEGRATION_STUB: 'warn',
  PLANNED: 'muted',
};

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports-executive'],
    queryFn: async () =>
      (await api.get<ExecutiveReport>('/reports/executive')).data,
  });

  const { data: stations } = useQuery({
    queryKey: ['reports-stations'],
    queryFn: async () =>
      (await api.get<StationProfitRow[]>('/reports/stations')).data,
  });

  const { data: trends } = useQuery({
    queryKey: ['reports-trends'],
    queryFn: async () =>
      (await api.get<RevenueTrendPoint[]>('/reports/trends?days=14')).data,
  });

  const { data: cashflow } = useQuery({
    queryKey: ['reports-cashflow'],
    queryFn: async () =>
      (await api.get<CashFlowForecast>('/reports/cashflow')).data,
  });

  if (isLoading || !data) {
    return <div className="panel">Loading executive report…</div>;
  }

  const maxTrend = Math.max(...(trends ?? []).map((t) => t.revenue), 1);

  return (
    <div className="stack">
      <PageHeader
        title="Executive BI"
        subtitle={`Haroti Gas ERP — charter-aligned performance (Phase ${data.charterPhase})`}
      />

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Gross margin / kg</h3>
          <div className="value">{formatMoney(data.grossMarginPerKg)}</div>
          <div className="hint">Month-to-date estimate</div>
        </div>
        <div className="panel stat-card">
          <h3>Month revenue</h3>
          <div className="value">{formatMoney(data.totalRevenueMonth)}</div>
          <div className="hint">{formatKg(data.totalKgMonth)} LPG sold</div>
        </div>
        <div className="panel stat-card">
          <h3>PAYC deferred</h3>
          <div className="value">{formatMoney(data.paycSummary.deferredRevenue)}</div>
          <div className="hint">
            {data.paycSummary.meters} meters · {data.paycSummary.alerts ?? 0} alerts
          </div>
        </div>
        <div className="panel stat-card">
          <h3>CAPEX portfolio</h3>
          <div className="value">
            {formatMoney(data.projectsSummary?.totalSpent ?? 0)}
          </div>
          <div className="hint">
            {data.projectsSummary?.active ?? 0} active ·{' '}
            {data.cmmsSummary?.openWorkOrders ?? 0} open WOs
          </div>
        </div>
      </div>

      {cashflow && (
        <div className="grid stats">
          <div className="panel stat-card">
            <h3>Daily avg revenue</h3>
            <div className="value">{formatMoney(cashflow.dailyAverageRevenue)}</div>
          </div>
          <div className="panel stat-card">
            <h3>Projected month-end</h3>
            <div className="value">{formatMoney(cashflow.projectedMonthEnd)}</div>
          </div>
          <div className="panel stat-card">
            <h3>CAPEX remaining</h3>
            <div className="value">{formatMoney(cashflow.capexRemaining)}</div>
          </div>
        </div>
      )}

      {trends && trends.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">14-day revenue trend</h3>
          <div className="trend-bars">
            {trends.map((t) => (
              <div key={t.date} className="trend-bar-col" title={`${t.date}: ${formatMoney(t.revenue)}`}>
                <div
                  className="trend-bar"
                  style={{ height: `${Math.max(4, (t.revenue / maxTrend) * 100)}%` }}
                />
                <small>{t.date.slice(5)}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Station P&L (MTD)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Revenue</th>
                  <th>KG</th>
                  <th>Gross profit</th>
                  <th>Txns</th>
                </tr>
              </thead>
              <tbody>
                {(stations ?? []).map((s) => (
                  <tr key={s.code}>
                    <td>
                      {s.code}
                      {s.isFranchise && (
                        <span className="badge warn" style={{ marginLeft: 6 }}>
                          FR
                        </span>
                      )}
                    </td>
                    <td>{formatMoney(s.revenue)}</td>
                    <td>{formatKg(s.kgSold)}</td>
                    <td className={s.grossProfit >= 0 ? 'ok-text' : 'warn-text'}>
                      {formatMoney(s.grossProfit)}
                    </td>
                    <td>{s.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Revenue by commercial stream</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Stream</th>
                  <th>Revenue</th>
                  <th>KG</th>
                  <th>Txns</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.commercialStreams).map(([stream, v]) => (
                  <tr key={stream}>
                    <td>{stream.replaceAll('_', ' ')}</td>
                    <td>{formatMoney(v.revenue)}</td>
                    <td>{formatKg(v.kg)}</td>
                    <td>{v.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Budget vs actual</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {data.budgetVsActual.map((row) => (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    <td>{formatMoney(row.budget)}</td>
                    <td className={row.variance >= 0 ? 'ok-text' : 'warn-text'}>
                      {formatMoney(row.variance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Charter module rollout</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Status</th>
                  <th>Phase</th>
                </tr>
              </thead>
              <tbody>
                {data.moduleStatus.map((m) => (
                  <tr key={m.module}>
                    <td>{m.module}</td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[m.status] ?? ''}`}>
                        {m.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td>{m.phase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
