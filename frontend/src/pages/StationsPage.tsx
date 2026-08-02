import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatKg } from '../lib/format';
import type { Station } from '../lib/types';

export function StationsPage() {
  const { data: stations, isLoading } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get<Station[]>('/stations')).data,
  });

  return (
    <div className="stack">
      <div className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <h2>Stations</h2>
          <p>Haroti Holdings network — Salima, Lilongwe and Blantyre</p>
        </div>
      </div>

      <div className="grid stats">
        {(stations ?? []).map((s) => {
          const stock = Number(s.currentStockKg);
          const capacity = Number(s.tankCapacityKg);
          const fill = capacity > 0 ? Math.round((stock / capacity) * 100) : 0;
          return (
            <div className="panel stat-card" key={s.id}>
              <h3>
                {s.code} · {s.district}
              </h3>
              <div className="value" style={{ fontSize: '1.35rem' }}>
                {s.name}
              </div>
              <div className="hint">{formatKg(stock)} / {formatKg(capacity)}</div>
              <div className="progress" style={{ marginTop: '0.75rem' }}>
                <span style={{ width: `${fill}%` }} />
              </div>
              <div className="row" style={{ marginTop: '0.6rem' }}>
                <span className="badge">{s.status}</span>
                <small className="muted">
                  Synced{' '}
                  {s.lastSyncedAt
                    ? new Date(s.lastSyncedAt).toLocaleString()
                    : 'never'}
                </small>
              </div>
            </div>
          );
        })}
      </div>
      {isLoading && <p>Loading stations…</p>}
    </div>
  );
}
