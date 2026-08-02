import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';

export function CylindersPage() {
  const { data: cylinders, isLoading } = useQuery({
    queryKey: ['cylinders'],
    queryFn: async () => (await api.get('/cylinders')).data,
  });

  return (
    <div className="stack">
      <div className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <h2>Cylinder register</h2>
          <p>Track company cylinders by serial, size, status and location</p>
        </div>
      </div>

      <div className="panel">
        {isLoading ? (
          <p>Loading cylinders…</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Station</th>
                  <th>Deposit</th>
                  <th>Next inspection</th>
                </tr>
              </thead>
              <tbody>
                {(cylinders ?? []).map(
                  (c: {
                    id: string;
                    serialNumber: string;
                    sizeKg: string;
                    status: string;
                    depositValue: string;
                    nextInspectionDate?: string;
                    station?: { code: string };
                  }) => (
                    <tr key={c.id}>
                      <td>{c.serialNumber}</td>
                      <td>{formatKg(c.sizeKg)}</td>
                      <td>
                        <span className="badge">{c.status}</span>
                      </td>
                      <td>{c.station?.code ?? '—'}</td>
                      <td>{formatMoney(c.depositValue)}</td>
                      <td>{c.nextInspectionDate ?? '—'}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
