import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { WorkOrder } from '../lib/erp-types';

export function MaintenancePage() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () =>
      (await api.get<WorkOrder[]>('/maintenance/work-orders')).data,
  });
  const { data: hydroDue } = useQuery({
    queryKey: ['hydro-due'],
    queryFn: async () => (await api.get('/maintenance/hydro-due')).data,
  });

  const generate = useMutation({
    mutationFn: () => api.post('/maintenance/generate-hydro-orders'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work-orders'] }),
  });

  return (
    <div className="stack">
      <PageHeader
        title="Asset maintenance (CMMS)"
        subtitle="Cylinder hydro-testing & work orders (Charter §8)"
      />

      <div className="row">
        <button
          className="btn btn-primary"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          Generate hydro-test work orders
        </button>
        <span className="badge warn">
          {Array.isArray(hydroDue) ? hydroDue.length : 0} cylinders due inspection
        </span>
      </div>

      <div className="panel">
        <h3 className="panel-title">Work orders</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>WO #</th>
                <th>Type</th>
                <th>Title</th>
                <th>Station</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((wo) => (
                <tr key={wo.id}>
                  <td>{wo.woNumber}</td>
                  <td>{wo.type.replaceAll('_', ' ')}</td>
                  <td>{wo.title}</td>
                  <td>{wo.station?.code ?? '—'}</td>
                  <td>{wo.dueDate ?? '—'}</td>
                  <td>
                    <span className="badge">{wo.status.replaceAll('_', ' ')}</span>
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    No open work orders — click generate for due hydro tests
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
