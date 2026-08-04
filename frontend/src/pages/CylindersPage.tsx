import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';

export function CylindersPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [incomingSerial, setIncomingSerial] = useState('');
  const [outgoingSerial, setOutgoingSerial] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [message, setMessage] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });
  const stationId = user?.stationId || stations?.[0]?.id;

  const { data: cylinders, isLoading } = useQuery({
    queryKey: ['cylinders', stationId],
    queryFn: async () =>
      (await api.get('/cylinders', { params: { stationId } })).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => (await api.get('/customers')).data,
  });

  const swapMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/cylinders/swap', {
          stationId,
          customerId,
          incomingSerial,
          outgoingSerial,
        })
      ).data,
    onSuccess: () => {
      setMessage('Cylinder swap recorded');
      setIncomingSerial('');
      setOutgoingSerial('');
      queryClient.invalidateQueries({ queryKey: ['cylinders'] });
    },
  });

  function onSwap(e: FormEvent) {
    e.preventDefault();
    swapMutation.mutate();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Cylinder register"
        subtitle="Track company cylinders and process swap-in / swap-out at refill"
      />
      {message && <div className="success">{message}</div>}

      <form className="panel stack" onSubmit={onSwap}>
        <h3 style={{ marginTop: 0 }}>Cylinder swap (CYL-004)</h3>
        <label>
          Customer
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            <option value="">Select customer</option>
            {(customers ?? []).map((c: { id: string; fullName: string }) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </label>
        <div className="grid two">
          <label>
            Incoming serial (empty returned)
            <input
              value={incomingSerial}
              onChange={(e) => setIncomingSerial(e.target.value)}
              placeholder="HH-LLW-01-0001"
              required
            />
          </label>
          <label>
            Outgoing serial (filled issued)
            <input
              value={outgoingSerial}
              onChange={(e) => setOutgoingSerial(e.target.value)}
              placeholder="HH-LLW-01-0002"
              required
            />
          </label>
        </div>
        <button className="btn btn-primary" disabled={swapMutation.isPending}>
          Record swap
        </button>
      </form>

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
