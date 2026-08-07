import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (isLoading) {
    return <div className="panel">Loading notifications…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Notifications"
        subtitle="In-app alerts and delivery status"
      />

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Event</th>
                <th>Message</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(notifications ?? []).map(
                (n: {
                  id: string;
                  createdAt: string;
                  eventType: string;
                  title: string;
                  body: string;
                  status: string;
                  readAt?: string;
                }) => (
                  <tr key={n.id}>
                    <td>{new Date(n.createdAt).toLocaleString()}</td>
                    <td>{n.eventType.replaceAll('.', ' · ')}</td>
                    <td>
                      <strong>{n.title}</strong>
                      <br />
                      <span className="muted">{n.body}</span>
                    </td>
                    <td>
                      <span className={`badge ${n.readAt ? '' : 'warn'}`}>
                        {n.readAt ? 'Read' : n.status}
                      </span>
                    </td>
                    <td>
                      {!n.readAt && (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => markReadMutation.mutate(n.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </td>
                  </tr>
                ),
              )}
              {!notifications?.length && (
                <tr>
                  <td colSpan={5} className="muted">
                    No notifications yet
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
