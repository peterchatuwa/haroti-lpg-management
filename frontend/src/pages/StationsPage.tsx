import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { TankGauge } from '../components/TankGauge';
import api from '../lib/api';
import { formatKg } from '../lib/format';
import type { Station } from '../lib/types';

export function StationsPage() {
  const { data: stations, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get<Station[]>('/stations')).data,
  });

  const grouped = (stations ?? []).reduce(
    (acc, s) => {
      (acc[s.district] ??= []).push(s);
      return acc;
    },
    {} as Record<string, Station[]>,
  );

  return (
    <div className="stack">
      <PageHeader
        title="Station network"
        subtitle="Eight Haroti Holdings sites across Malawi — one operating picture"
      />

      {isLoading && <div className="panel">Loading stations…</div>}

      {Object.entries(grouped).map(([district, list]) => (
        <section key={district} className="stack">
          <div className="row">
            <h3 style={{ margin: 0, fontFamily: 'Fraunces, serif' }}>{district}</h3>
            <span className="badge">{list.length} stations</span>
          </div>
          <div className="station-network">
            {list.map((s, i) => {
              const stock = Number(s.currentStockKg);
              const capacity = Number(s.tankCapacityKg);
              const fill = capacity > 0 ? (stock / capacity) * 100 : 0;
              return (
                <Link
                  to={`/stations/${s.id}`}
                  className="station-tile station-tile-link"
                  key={s.id}
                  style={{ animationDelay: `${i * 0.06}s`, textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <div className="code">{s.code}</div>
                      <div className="name">{s.name}</div>
                    </div>
                    <span className="badge">{s.status}</span>
                  </div>
                  <div className="row" style={{ alignItems: 'center', gap: '1rem' }}>
                    <TankGauge
                      fillPercent={fill}
                      label={formatKg(stock)}
                      sublabel={`of ${formatKg(capacity)}`}
                      size={100}
                    />
                    <div className="stack" style={{ gap: '0.35rem', flex: 1 }}>
                      <small className="muted">Manager</small>
                      <strong>{s.managerName ?? '—'}</strong>
                      <small className="muted">
                        Synced{' '}
                        {s.lastSyncedAt
                          ? new Date(s.lastSyncedAt).toLocaleString()
                          : 'never'}
                      </small>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
