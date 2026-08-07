import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';

interface ActionCentreResponse {
  total: number;
  items: Array<{ type: string; count: number; label: string }>;
}

export function ActionCentrePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['action-centre'],
    queryFn: async () =>
      (await api.get<ActionCentreResponse>('/action-centre')).data,
  });

  if (isLoading || !data) {
    return <div className="panel">Loading action centre…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Action centre"
        subtitle="Items needing attention across the network"
      />
      <div className="panel stat-card accent">
        <h3>Total open items</h3>
        <div className="value">{data.total}</div>
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.type}>
                  <td>{item.label}</td>
                  <td>
                    <span className="badge warn">{item.count}</span>
                  </td>
                </tr>
              ))}
              {!data.items.length && (
                <tr>
                  <td colSpan={2} className="muted">
                    Nothing pending — all clear
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
