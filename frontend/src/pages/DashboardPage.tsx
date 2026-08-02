import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';
import type { DashboardOverview } from '../lib/types';

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardOverview>('/dashboard/overview');
      return data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <p>Loading dashboard…</p>;
  if (error || !data) return <div className="error">Unable to load dashboard</div>;

  return (
    <div className="stack">
      <div className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <h2>Executive Dashboard</h2>
          <p>Live view across all Haroti Holdings LPG stations</p>
        </div>
      </div>

      <div className="grid stats">
        <div className="panel stat-card">
          <h3>Total LPG stock</h3>
          <div className="value">{formatKg(data.totalLpgStockKg)}</div>
          <div className="hint">
            {data.utilizationPercent}% of {formatKg(data.totalCapacityKg)} capacity
          </div>
        </div>
        <div className="panel stat-card">
          <h3>Sales today</h3>
          <div className="value">{formatMoney(data.salesToday)}</div>
          <div className="hint">
            {formatKg(data.kgSoldToday)} · {data.transactionsToday} transactions
          </div>
        </div>
        <div className="panel stat-card">
          <h3>Sales this month</h3>
          <div className="value">{formatMoney(data.salesMonth)}</div>
          <div className="hint">{formatKg(data.kgSoldMonth)} sold</div>
        </div>
        <div className="panel stat-card">
          <h3>Customer credit</h3>
          <div className="value">
            {formatMoney(data.outstandingCustomerBalances)}
          </div>
          <div className="hint">
            {data.openShifts} open shifts · {data.unconfirmedTransfers} transfers pending
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Station comparison</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Stock</th>
                  <th>Today</th>
                  <th>Month</th>
                  <th>Fill</th>
                </tr>
              </thead>
              <tbody>
                {data.stations.map((s) => {
                  const fill =
                    s.tankCapacityKg > 0
                      ? Math.round((s.currentStockKg / s.tankCapacityKg) * 100)
                      : 0;
                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.code}</strong>
                        <div className="muted">{s.name}</div>
                      </td>
                      <td>{formatKg(s.currentStockKg)}</td>
                      <td>
                        {formatMoney(s.salesToday)}
                        <div className="muted">{formatKg(s.kgToday)}</div>
                      </td>
                      <td>{formatMoney(s.salesMonth)}</td>
                      <td style={{ minWidth: 120 }}>
                        <div className="progress">
                          <span style={{ width: `${fill}%` }} />
                        </div>
                        <small className="muted">{fill}%</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Top performer today</h3>
            {data.topStation ? (
              <>
                <div className="value" style={{ fontFamily: 'Fraunces, serif' }}>
                  {data.topStation.code}
                </div>
                <p className="muted">{data.topStation.name}</p>
                <strong>{formatMoney(data.topStation.salesToday)}</strong>
              </>
            ) : (
              <p className="muted">No sales yet today</p>
            )}
          </div>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Operations alerts</h3>
            <ul className="stack" style={{ paddingLeft: '1.1rem', margin: 0 }}>
              <li>{data.cylindersWithCustomers} cylinders with customers</li>
              <li>{data.damagedCylinders} damaged cylinders</li>
              <li>{data.unconfirmedTransfers} unconfirmed transfers</li>
              <li>Month expenses: {formatMoney(data.expensesMonth)}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
