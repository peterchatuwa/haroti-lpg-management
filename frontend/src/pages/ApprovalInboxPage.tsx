import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';

export function ApprovalInboxPage() {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['approval-tasks'],
    queryFn: async () => (await api.get('/approval-tasks')).data,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/approval-tasks/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['action-centre'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/approval-tasks/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['action-centre'] });
    },
  });

  if (isLoading) {
    return <div className="panel">Loading approval inbox…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Approval inbox"
        subtitle="Consolidated workflow tasks assigned to your role"
      />

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Station</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(tasks ?? []).map(
                (t: {
                  id: string;
                  taskNumber: string;
                  entityType: string;
                  amount: string;
                  summary?: string;
                  dueAt: string;
                  station?: { code: string };
                }) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.taskNumber}</strong>
                      <br />
                      <span className="muted">{t.summary ?? '—'}</span>
                    </td>
                    <td>{t.entityType.replaceAll('_', ' ')}</td>
                    <td>{formatMoney(t.amount)}</td>
                    <td>{t.station?.code ?? 'Network'}</td>
                    <td>{new Date(t.dueAt).toLocaleString()}</td>
                    <td>
                      <div className="row">
                        <button
                          type="button"
                          className="btn btn-sm btn-accent"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(t.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(t.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
              {!tasks?.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    No pending approvals for your role
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
