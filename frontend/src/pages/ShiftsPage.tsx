import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';

export function ShiftsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [float, setFloat] = useState(50000);
  const [cashCounted, setCashCounted] = useState(0);
  const [physicalStock, setPhysicalStock] = useState(0);
  const [message, setMessage] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });

  const stationId = user?.stationId || stations?.[0]?.id;

  const { data: current } = useQuery({
    queryKey: ['current-shift', stationId],
    enabled: !!stationId,
    queryFn: async () =>
      (await api.get('/shifts/current', { params: { stationId } })).data,
  });

  const { data: shifts } = useQuery({
    queryKey: ['shifts'],
    queryFn: async () => (await api.get('/shifts')).data,
  });

  const openMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/shifts/open', {
          stationId,
          openingCashFloat: float,
          openingCylinderCount: 20,
        })
      ).data,
    onSuccess: () => {
      setMessage('Shift opened');
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (shiftId: string) =>
      (await api.post(`/shifts/${shiftId}/approve`)).data,
    onSuccess: () => {
      setMessage('Shift approved and locked');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/shifts/${current.id}/close`, {
          cashCounted,
          physicalLpgStockKg: physicalStock,
          cashDeposited: 0,
          closingCylinderCount: 20,
        })
      ).data,
    onSuccess: (data) => {
      setMessage(
        `Shift closed. Cash variance ${formatMoney(data.cashVariance)}, stock variance ${formatKg(data.stockVarianceKg)}`,
      );
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const canApprove = ['STATION_MANAGER', 'OPERATIONS_MANAGER', 'SYSTEM_ADMIN', 'DIRECTOR'].includes(
    user?.role ?? '',
  );

  function onOpen(e: FormEvent) {
    e.preventDefault();
    openMutation.mutate();
  }

  function onClose(e: FormEvent) {
    e.preventDefault();
    closeMutation.mutate();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Shift control"
        subtitle="Open and close attendant shifts with cash and stock reconciliation"
      />
      {message && <div className="success">{message}</div>}

      <div className="grid two">
        <div className="panel">
          {current ? (
            <form className="stack" onSubmit={onClose}>
              <h3 style={{ marginTop: 0 }}>Close current shift</h3>
              <p className="muted">
                Opened {new Date(current.openedAt).toLocaleString()} · Opening float{' '}
                {formatMoney(current.openingCashFloat)} · Opening stock{' '}
                {formatKg(current.openingLpgStockKg)}
              </p>
              <label>
                Cash counted
                <input
                  type="number"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(Number(e.target.value))}
                  required
                />
              </label>
              <label>
                Physical LPG stock (kg)
                <input
                  type="number"
                  step="0.001"
                  value={physicalStock}
                  onChange={(e) => setPhysicalStock(Number(e.target.value))}
                  required
                />
              </label>
              <button className="btn btn-primary" disabled={closeMutation.isPending}>
                Close shift
              </button>
            </form>
          ) : (
            <form className="stack" onSubmit={onOpen}>
              <h3 style={{ marginTop: 0 }}>Open shift</h3>
              <label>
                Opening cash float
                <input
                  type="number"
                  value={float}
                  onChange={(e) => setFloat(Number(e.target.value))}
                  required
                />
              </label>
              <button className="btn btn-accent" disabled={openMutation.isPending}>
                Open shift
              </button>
            </form>
          )}
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Recent shifts</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Status</th>
                  <th>Cash var</th>
                  <th>Stock var</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(shifts ?? []).slice(0, 10).map(
                  (s: {
                    id: string;
                    status: string;
                    cashVariance?: string;
                    stockVarianceKg?: string;
                    station?: { code: string };
                  }) => (
                    <tr key={s.id}>
                      <td>{s.station?.code}</td>
                      <td>
                        <span className="badge">{s.status.replaceAll('_', ' ')}</span>
                      </td>
                      <td>{formatMoney(s.cashVariance ?? 0)}</td>
                      <td>{formatKg(s.stockVarianceKg ?? 0)}</td>
                      <td>
                        {canApprove && s.status === 'PENDING_APPROVAL' && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(s.id)}
                          >
                            Approve
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
    </div>
  );
}
