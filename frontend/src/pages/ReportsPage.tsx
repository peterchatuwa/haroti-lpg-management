import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { ExecutiveReport } from '../lib/erp-types';
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

  if (isLoading || !data) {
    return <div className="panel">Loading executive report…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Executive BI"
        subtitle="Haroti Gas ERP — charter-aligned performance (Phase 1)"
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
          <div className="hint">{data.paycSummary.meters} smart meters</div>
        </div>
        <div className="panel stat-card">
          <h3>Network</h3>
          <div className="value">{data.ownedStations + data.franchiseOutlets}</div>
          <div className="hint">
            {data.franchiseOutlets} franchise · {data.ownedStations} owned
          </div>
        </div>
      </div>

      <div className="grid two">
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

        <div className="panel">
          <h3 className="panel-title">Sales by pricing channel</h3>
          <ul className="alert-list">
            {Object.entries(data.salesByChannel).map(([ch, amt]) => (
              <li key={ch}>
                <span>{ch.replaceAll('_', ' ')}</span>
                <strong>{formatMoney(amt)}</strong>
              </li>
            ))}
          </ul>
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
