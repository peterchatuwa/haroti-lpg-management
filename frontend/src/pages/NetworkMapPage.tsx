import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg } from '../lib/format';

const HEALTH_COLOR: Record<string, string> = {
  GREEN: '#22c55e',
  AMBER: '#f59e0b',
  RED: '#ef4444',
};

export function NetworkMapPage() {
  const { data: stations, isLoading } = useQuery({
    queryKey: ['network-map'],
    queryFn: async () => (await api.get('/network/map')).data,
  });

  if (isLoading || !stations) {
    return <div className="panel">Loading network map…</div>;
  }

  const withCoords = stations.filter(
    (s: { latitude: number | null }) => s.latitude != null,
  );
  const lats = withCoords.map((s: { latitude: number }) => s.latitude);
  const lngs = withCoords.map((s: { longitude: number }) => s.longitude);
  const minLat = Math.min(...lats, -16);
  const maxLat = Math.max(...lats, -13);
  const minLng = Math.min(...lngs, 33);
  const maxLng = Math.max(...lngs, 35);

  function pos(lat: number, lng: number) {
    const x = ((lng - minLng) / (maxLng - minLng || 1)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat || 1)) * 100;
    return { left: `${x}%`, top: `${y}%` };
  }

  return (
    <div className="stack">
      <PageHeader
        title="Network map"
        subtitle="Station health, stock levels and runout risk across Malawi"
      />

      <div className="panel" style={{ position: 'relative', minHeight: 420 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 400,
            background:
              'linear-gradient(180deg, rgba(14,116,144,0.08) 0%, rgba(15,23,42,0.04) 100%)',
            borderRadius: 8,
          }}
        >
          {withCoords.map(
            (s: {
              id: string;
              code: string;
              health: string;
              latitude: number;
              longitude: number;
              stockPct: number;
              daysToRunout: number;
              currentStockKg: number;
            }) => {
              const p = pos(s.latitude, s.longitude);
              return (
                <div
                  key={s.id}
                  title={`${s.code}: ${s.stockPct}% · ~${s.daysToRunout}d runout`}
                  style={{
                    position: 'absolute',
                    ...p,
                    transform: 'translate(-50%, -50%)',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: HEALTH_COLOR[s.health] ?? '#94a3b8',
                    border: '2px solid white',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }}
                />
              );
            },
          )}
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Station</th>
                <th>Health</th>
                <th>Stock</th>
                <th>Runout</th>
                <th>Open shifts</th>
              </tr>
            </thead>
            <tbody>
              {stations.map(
                (s: {
                  id: string;
                  code: string;
                  health: string;
                  stockPct: number;
                  daysToRunout: number;
                  currentStockKg: number;
                  openShifts: number;
                }) => (
                  <tr key={s.id}>
                    <td>{s.code}</td>
                    <td>
                      <span className={`badge ${s.health === 'GREEN' ? '' : 'warn'}`}>
                        {s.health}
                      </span>
                    </td>
                    <td>
                      {formatKg(s.currentStockKg)} ({s.stockPct}%)
                    </td>
                    <td>{s.daysToRunout >= 999 ? '—' : `~${s.daysToRunout}d`}</td>
                    <td>{s.openShifts}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
