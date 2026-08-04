import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { TankGauge } from '../components/TankGauge';
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
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="stack">
        <PageHeader title="Network pulse" subtitle="Loading live station data…" />
        <div className="panel">Gathering stock, sales and alerts…</div>
      </div>
    );
  }
  if (error || !data) {
    return <div className="error">Unable to load dashboard</div>;
  }

  const maxSales = Math.max(...data.stations.map((s) => s.salesToday), 1);
  const byDistrict = data.stations.reduce(
    (acc, s) => {
      acc[s.district] = (acc[s.district] ?? 0) + s.currentStockKg;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="stack">
      <PageHeader
        title="Network pulse"
        subtitle="Haroti Gas ERP — live ops across Salima, Lilongwe and Blantyre"
        action={
          <Link className="btn btn-ghost" to="/reports">
            Executive BI →
          </Link>
        }
      />

      <div className="hero-dash">
        <div className="hero-dash-main">
          <div>
            <h3>Total LPG in network</h3>
            <div className="big">{formatKg(data.totalLpgStockKg)}</div>
            <p className="muted" style={{ color: 'rgba(247,250,248,0.7)', margin: 0 }}>
              {data.utilizationPercent}% of {formatKg(data.totalCapacityKg)} tank
              capacity · refreshed every 15s
            </p>
          </div>
          <div className="district-strip">
            {Object.entries(byDistrict).map(([district, kg]) => (
              <div className="district-chip" key={district} style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)', color: '#f7faf8' }}>
                {district}
                <em style={{ color: '#f0b429' }}>{formatKg(kg)}</em>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-dash-side">
          <div className="panel stat-card accent" style={{ margin: 0 }}>
            <h3>Sales today</h3>
            <div className="value">{formatMoney(data.salesToday)}</div>
            <div className="hint">
              {formatKg(data.kgSoldToday)} · {data.transactionsToday} transactions
            </div>
          </div>
          <div className="panel" style={{ margin: 0, display: 'grid', placeItems: 'center' }}>
            <TankGauge
              fillPercent={data.utilizationPercent}
              label="Network fill"
              sublabel={`${data.stations.length} stations`}
              size={130}
            />
          </div>
        </div>
      </div>

      <div className="grid stats">
        <div className="panel stat-card">
          <h3>This month</h3>
          <div className="value">{formatMoney(data.salesMonth)}</div>
          <div className="hint">{formatKg(data.kgSoldMonth)} sold</div>
        </div>
        <div className="panel stat-card">
          <h3>Customer credit</h3>
          <div className="value">
            {formatMoney(data.outstandingCustomerBalances)}
          </div>
          <div className="hint">Outstanding balances</div>
        </div>
        <div className="panel stat-card">
          <h3>Open shifts</h3>
          <div className="value">{data.openShifts}</div>
          <div className="hint">
            {data.unconfirmedTransfers} transfers in transit
          </div>
        </div>
        <div className="panel stat-card deep">
          <h3>Top station</h3>
          <div className="value" style={{ fontSize: '1.45rem' }}>
            {data.topStation?.code ?? '—'}
          </div>
          <div className="hint">
            {data.topStation
              ? formatMoney(data.topStation.salesToday)
              : 'No sales yet'}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Today’s sales by station</h3>
          <div className="station-bars">
            {[...data.stations]
              .sort((a, b) => b.salesToday - a.salesToday)
              .map((s) => (
                <div className="station-bar-row" key={s.id}>
                  <strong>{s.code}</strong>
                  <div className="station-bar-track">
                    <div
                      className="station-bar-fill"
                      style={{
                        width: `${Math.max(4, (s.salesToday / maxSales) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>{formatMoney(s.salesToday)}</small>
                </div>
              ))}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 className="panel-title">Tank levels</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Station</th>
                    <th>Stock</th>
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
                          <div className="muted">{s.district}</div>
                        </td>
                        <td>{formatKg(s.currentStockKg)}</td>
                        <td style={{ minWidth: 110 }}>
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
          <div className="panel">
            <h3 className="panel-title">Operations watchlist</h3>
            <ul className="alert-list">
              <li>
                <span>Cylinders with customers</span>
                <strong>{data.cylindersWithCustomers}</strong>
              </li>
              <li>
                <span>Damaged cylinders</span>
                <strong>{data.damagedCylinders}</strong>
              </li>
              <li>
                <span>Unconfirmed transfers</span>
                <strong>{data.unconfirmedTransfers}</strong>
              </li>
              <li>
                <span>Month expenses</span>
                <strong>{formatMoney(data.expensesMonth)}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
