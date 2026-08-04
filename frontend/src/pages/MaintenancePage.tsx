import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { AssetRow, WorkOrder } from '../lib/erp-types';

export function MaintenancePage() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ['work-orders'],
    queryFn: async () =>
      (await api.get<WorkOrder[]>('/maintenance/work-orders')).data,
  });
  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () =>
      (await api.get<AssetRow[]>('/maintenance/assets')).data,
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
        subtitle="Fixed assets, cylinder hydro-testing & work order lifecycle (Phase 2)"
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
        <span className="badge">{assets?.length ?? 0} registered assets</span>
      </div>

      <div className="panel">
        <h3 className="panel-title">Fixed assets</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Category</th>
                <th>Station</th>
                <th>Next service</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(assets ?? []).map((a) => (
                <tr key={a.id}>
                  <td>{a.assetCode}</td>
                  <td>{a.name}</td>
                  <td>{a.category.replaceAll('_', ' ')}</td>
                  <td>{a.station?.code ?? '—'}</td>
                  <td>{a.nextServiceDate ?? '—'}</td>
                  <td>
                    <span className="badge">{a.status.replaceAll('_', ' ')}</span>
                  </td>
                </tr>
              ))}
              {!assets?.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    No assets registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                <th>Cylinder</th>
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
                  <td>{wo.cylinder?.serialNumber ?? '—'}</td>
                  <td>{wo.station?.code ?? '—'}</td>
                  <td>{wo.dueDate ?? '—'}</td>
                  <td>
                    <span className="badge">{wo.status.replaceAll('_', ' ')}</span>
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={7} className="muted">
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
