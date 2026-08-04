import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';

interface Requisition {
  id: string;
  requisitionNumber: string;
  category: string;
  totalAmount: string;
  status: string;
  notes?: string;
  station?: { code: string; name: string };
  requestedBy?: { fullName: string };
  lines?: Array<{ itemDescription: string; quantity: number; unitCost: string }>;
}

const GM_ROLES = new Set([
  'SYSTEM_ADMIN',
  'DIRECTOR',
  'OPERATIONS_MANAGER',
]);

const FINANCE_ROLES = new Set([
  'SYSTEM_ADMIN',
  'DIRECTOR',
  'FINANCE_MANAGER',
]);

export function RequisitionsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const [category, setCategory] = useState('Station supplies');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(50000);
  const [notes, setNotes] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });
  const stationId = user?.stationId || stations?.[0]?.id;

  const { data: requisitions } = useQuery({
    queryKey: ['requisitions'],
    queryFn: async () =>
      (await api.get<Requisition[]>('/requisitions')).data,
  });

  const { data: summary } = useQuery({
    queryKey: ['requisitions-summary'],
    queryFn: async () =>
      (await api.get<{ pendingGmApproval: number; readyToPay: number }>(
        '/requisitions/pending-summary',
      )).data,
    refetchInterval: 15000,
  });

  const canRequest =
    user?.role === 'STATION_MANAGER' ||
    user?.role === 'STOREKEEPER' ||
    user?.role === 'ATTENDANT' ||
    user?.role === 'OPERATIONS_MANAGER' ||
    user?.role === 'SYSTEM_ADMIN';

  const isGm = GM_ROLES.has(user?.role ?? '');
  const isFinance = FINANCE_ROLES.has(user?.role ?? '');

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/requisitions', {
          stationId,
          category,
          notes,
          lines: [{ itemDescription: description, quantity, unitCost }],
        })
      ).data,
    onSuccess: () => {
      setMsg('Requisition submitted — awaiting GM approval');
      setDescription('');
      qc.invalidateQueries({ queryKey: ['requisitions'] });
      qc.invalidateQueries({ queryKey: ['requisitions-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/requisitions/${id}/approve`),
    onSuccess: () => {
      setMsg('Approved — finance can now pay');
      qc.invalidateQueries({ queryKey: ['requisitions'] });
      qc.invalidateQueries({ queryKey: ['requisitions-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/requisitions/${id}/reject`, { reason: 'Not approved' }),
    onSuccess: () => {
      setMsg('Requisition rejected');
      qc.invalidateQueries({ queryKey: ['requisitions'] });
      qc.invalidateQueries({ queryKey: ['requisitions-summary'] });
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => api.post(`/requisitions/${id}/pay`, {}),
    onSuccess: () => {
      setMsg('Payment recorded and posted to GL');
      qc.invalidateQueries({ queryKey: ['requisitions'] });
      qc.invalidateQueries({ queryKey: ['requisitions-summary'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['finance-trial-balance'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  function statusBadge(status: string) {
    if (status === 'SUBMITTED') {
      return <span className="badge warn">Pending GM approval</span>;
    }
    if (status === 'READY_TO_PAY') {
      return <span className="badge ok">Ready to pay</span>;
    }
    if (status === 'PAID') {
      return <span className="badge">Paid</span>;
    }
    if (status === 'REJECTED') {
      return <span className="badge danger">Rejected</span>;
    }
    return <span className="badge">{status.replaceAll('_', ' ')}</span>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Requisitions"
        subtitle="Station request → GM approval → finance payment"
      />

      {(summary?.pendingGmApproval ?? 0) > 0 && isGm && (
        <div className="panel warn-panel">
          <strong>{summary?.pendingGmApproval} requisition(s)</strong> awaiting
          your approval.
        </div>
      )}

      {(summary?.readyToPay ?? 0) > 0 && isFinance && (
        <div className="panel ok-panel">
          <strong className="ok-text">
            {summary?.readyToPay} requisition(s) approved — ready to pay
          </strong>
        </div>
      )}

      {msg && <div className="panel ok-panel">{msg}</div>}

      {canRequest && (
        <form className="panel stack" onSubmit={onSubmit}>
          <h3 className="panel-title">New requisition</h3>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {[
                'Station supplies',
                'Maintenance',
                'Fuel & transport',
                'Safety equipment',
                'Office supplies',
                'Other',
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Item description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="e.g. Fire extinguisher refill"
            />
          </label>
          <div className="grid two">
            <label>
              Quantity
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </label>
            <label>
              Unit cost (MWK)
              <input
                type="number"
                min={1}
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                required
              />
            </label>
          </div>
          <label>
            Notes
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" disabled={createMutation.isPending}>
            Submit for GM approval
          </button>
        </form>
      )}

      <div className="panel">
        <h3 className="panel-title">Requisition register</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>REQ #</th>
                <th>Station</th>
                <th>Category</th>
                <th>Requested by</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(requisitions ?? []).map((r) => (
                <tr
                  key={r.id}
                  className={r.status === 'READY_TO_PAY' && isFinance ? 'row-ready-pay' : undefined}
                >
                  <td>{r.requisitionNumber}</td>
                  <td>{r.station?.code ?? '—'}</td>
                  <td>{r.category}</td>
                  <td>{r.requestedBy?.fullName ?? '—'}</td>
                  <td>{formatMoney(r.totalAmount)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td className="row">
                    {r.status === 'SUBMITTED' && isGm && (
                      <>
                        <button
                          className="btn btn-sm"
                          onClick={() => approveMutation.mutate(r.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => rejectMutation.mutate(r.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === 'READY_TO_PAY' && isFinance && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => payMutation.mutate(r.id)}
                      >
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!requisitions?.length && (
                <tr>
                  <td colSpan={7} className="muted">
                    No requisitions yet.
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
