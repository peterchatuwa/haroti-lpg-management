import { useOfflineStore } from '../store/offline';
import { PageHeader } from '../components/PageHeader';

export function SyncCentrePage() {
  const queue = useOfflineStore((s) => s.queue);
  const online = useOfflineStore((s) => s.online);
  const clearResolved = useOfflineStore((s) => s.clearResolved);

  const pending = queue.filter((q) => !q.synced && !q.conflict);
  const conflicts = queue.filter((q) => q.conflict);
  const synced = queue.filter((q) => q.synced);

  return (
    <div className="stack">
      <PageHeader
        title="Sync centre"
        subtitle="Offline POS queue — IndexedDB backed"
        action={
          <span className={`badge ${online ? '' : 'warn'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
        }
      />

      <div className="grid stats">
        <div className="panel stat-card warn">
          <h3>Pending</h3>
          <div className="value">{pending.length}</div>
        </div>
        <div className="panel stat-card">
          <h3>Conflicts</h3>
          <div className="value">{conflicts.length}</div>
        </div>
        <div className="panel stat-card accent">
          <h3>Synced</h3>
          <div className="value">{synced.length}</div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Conflicts — manager resolution required</h3>
          {conflicts.map((c) => (
            <div key={c.clientTxnId} className="error" style={{ marginBottom: '0.5rem' }}>
              <strong>{c.clientTxnId.slice(0, 8)}</strong>: {c.errorMessage ?? '409 conflict'}
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <h3 className="panel-title">Queue</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client txn</th>
                <th>Created</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((q) => (
                <tr key={q.clientTxnId}>
                  <td>{q.clientTxnId.slice(0, 8)}</td>
                  <td>{new Date(q.createdAt).toLocaleString()}</td>
                  <td>
                    {q.conflict ? (
                      <span className="badge warn">Conflict</span>
                    ) : q.synced ? (
                      <span className="badge">Synced</span>
                    ) : (
                      <span className="badge warn">Pending</span>
                    )}
                  </td>
                  <td className="muted">{q.errorMessage ?? '—'}</td>
                </tr>
              ))}
              {!queue.length && (
                <tr>
                  <td colSpan={4} className="muted">
                    Queue empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => clearResolved()}>
          Clear resolved
        </button>
      </div>
    </div>
  );
}
