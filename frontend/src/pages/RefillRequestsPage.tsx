import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg } from '../lib/format';

export function RefillRequestsPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['refill-requests-admin'],
    queryFn: async () => (await api.get('/customer-portal/admin/refill-requests')).data,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/customer-portal/admin/refill-requests/${id}`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['refill-requests-admin'] }),
  });

  if (isLoading) return <div className="panel">Loading refill requests…</div>;

  return (
    <div className="stack">
      <PageHeader title="Refill requests" subtitle="Customer portal delivery/refill reservations" />
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Customer</th>
                <th>Station</th>
                <th>Qty</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(requests ?? []).map(
                (r: {
                  id: string;
                  requestNumber: string;
                  status: string;
                  quantityKg: string;
                  customer?: { fullName: string };
                  station?: { code: string };
                }) => (
                  <tr key={r.id}>
                    <td>{r.requestNumber}</td>
                    <td>{r.customer?.fullName}</td>
                    <td>{r.station?.code ?? 'Any'}</td>
                    <td>{formatKg(r.quantityKg)}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === 'PENDING' && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() =>
                            updateMutation.mutate({ id: r.id, status: 'ACCEPTED' })
                          }
                        >
                          Accept
                        </button>
                      )}
                    </td>
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
