import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { TankGauge } from '../components/TankGauge';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';

export function StationOverviewPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['station-overview', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/stations/${id}/overview`)).data,
  });

  if (isLoading || !data) {
    return (
      <div className="stack">
        <PageHeader title="Station overview" subtitle="Loading…" />
        <div className="panel">Loading station data…</div>
      </div>
    );
  }

  const s = data.station;

  return (
    <div className="stack">
      <PageHeader
        title={`${s.code} — ${s.name}`}
        subtitle={`${s.district} · ${s.status.replaceAll('_', ' ')}`}
        action={
          <Link className="btn btn-ghost" to="/">
            ← Dashboard
          </Link>
        }
      />

      <div className="hero-dash">
        <div className="hero-dash-main">
          <div>
            <h3>Bulk LPG stock</h3>
            <div className="big">{formatKg(s.currentStockKg)}</div>
            <p className="muted" style={{ color: 'rgba(247,250,248,0.7)', margin: 0 }}>
              {s.fillPercent}% of {formatKg(s.tankCapacityKg)} capacity
              {s.managerName ? ` · Manager: ${s.managerName}` : ''}
            </p>
          </div>
        </div>
        <div className="hero-dash-side">
          <div className="panel" style={{ margin: 0, display: 'grid', placeItems: 'center' }}>
            <TankGauge
              fillPercent={s.fillPercent}
              label={s.code}
              sublabel="Tank fill"
              size={130}
            />
          </div>
        </div>
      </div>

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Sales today</h3>
          <div className="value">{formatMoney(data.today.salesTotal)}</div>
          <div className="hint">
            {formatKg(data.today.kgSold)} · {data.today.transactions} txns
          </div>
        </div>
        <div className="panel stat-card">
          <h3>Month to date</h3>
          <div className="value">{formatMoney(data.month.salesTotal)}</div>
          <div className="hint">{formatKg(data.month.kgSold)} sold</div>
        </div>
        <div className="panel stat-card">
          <h3>Month expenses</h3>
          <div className="value">{formatMoney(data.month.expensesTotal)}</div>
        </div>
        <div className="panel stat-card">
          <h3>Open shifts</h3>
          <div className="value">{data.openShifts}</div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Today&apos;s sales</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>LPG</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map(
                  (sale: {
                    id: string;
                    receiptNumber: string;
                    soldAt: string;
                    totalAmount: number;
                    lpgQuantityKg: number;
                  }) => (
                    <tr key={sale.id}>
                      <td>{sale.receiptNumber}</td>
                      <td>
                        {new Date(sale.soldAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>{formatMoney(sale.totalAmount)}</td>
                      <td>{formatKg(sale.lpgQuantityKg)}</td>
                    </tr>
                  ),
                )}
                {!data.recentSales.length && (
                  <tr>
                    <td colSpan={4} className="muted">
                      No sales today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3 className="panel-title">Recent shifts</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Attendant</th>
                    <th>Status</th>
                    <th>Variance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentShifts.map(
                    (sh: {
                      id: string;
                      attendant?: string;
                      status: string;
                      cashVariance?: number | null;
                    }) => (
                      <tr key={sh.id}>
                        <td>{sh.attendant ?? '—'}</td>
                        <td>
                          <span className="badge">{sh.status}</span>
                        </td>
                        <td>
                          {sh.cashVariance != null
                            ? formatMoney(sh.cashVariance)
                            : '—'}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel">
            <h3 className="panel-title">Tanks</h3>
            <ul className="alert-list">
              {(data.tanks ?? []).map(
                (t: {
                  code: string;
                  currentStockKg: number;
                  capacityKg: number;
                }) => (
                  <li key={t.code}>
                    <span>{t.code}</span>
                    <strong>
                      {formatKg(t.currentStockKg)} / {formatKg(t.capacityKg)}
                    </strong>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
