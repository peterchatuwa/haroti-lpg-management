import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg } from '../lib/format';

export function TransfersPage() {
  const queryClient = useQueryClient();
  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [qty, setQty] = useState(500);
  const [message, setMessage] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });
  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => (await api.get('/transfers')).data,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/transfers', {
          sourceStationId: sourceId || stations?.[0]?.id,
          destinationStationId: destId || stations?.[1]?.id,
          notes: 'Inter-station LPG transfer',
          items: [
            {
              itemType: 'LPG',
              description: 'Bulk LPG',
              quantityDispatched: qty,
              unit: 'kg',
            },
          ],
        })
      ).data,
    onSuccess: (data) => {
      setMessage(`Transfer ${data.transferNumber} dispatched`);
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (transfer: {
      id: string;
      items: { id: string; quantityDispatched: string }[];
    }) =>
      (
        await api.post(`/transfers/${transfer.id}/receive`, {
          items: transfer.items.map((i) => ({
            itemId: i.id,
            quantityReceived: Number(i.quantityDispatched),
          })),
        })
      ).data,
    onSuccess: (data) => {
      setMessage(`Transfer ${data.transferNumber} confirmed`);
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Station transfers"
        subtitle="Dispatch and confirm LPG moves between stations"
      />
      {message && <div className="success">{message}</div>}

      <div className="grid two">
        <form className="panel stack" onSubmit={onSubmit}>
          <h3 style={{ marginTop: 0 }}>Create transfer</h3>
          <label>
            Source station
            <select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
              <option value="">Select source</option>
              {(stations ?? []).map((s: { id: string; code: string; name: string }) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Destination station
            <select value={destId} onChange={(e) => setDestId(e.target.value)}>
              <option value="">Select destination</option>
              {(stations ?? []).map((s: { id: string; code: string; name: string }) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            LPG quantity (kg)
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              required
            />
          </label>
          <button className="btn btn-primary" disabled={createMutation.isPending}>
            Dispatch transfer
          </button>
        </form>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Transfer board</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(transfers ?? []).map(
                  (t: {
                    id: string;
                    transferNumber: string;
                    status: string;
                    sourceStation?: { code: string };
                    destinationStation?: { code: string };
                    items: { id: string; quantityDispatched: string }[];
                  }) => (
                    <tr key={t.id}>
                      <td>
                        {t.transferNumber}
                        <div className="muted">
                          {formatKg(t.items?.[0]?.quantityDispatched ?? 0)}
                        </div>
                      </td>
                      <td>
                        {t.sourceStation?.code} → {t.destinationStation?.code}
                      </td>
                      <td>
                        <span className="badge">{t.status}</span>
                      </td>
                      <td>
                        {['IN_TRANSIT', 'DISPATCHED'].includes(t.status) && (
                          <button
                            className="btn btn-ghost"
                            type="button"
                            onClick={() => receiveMutation.mutate(t)}
                          >
                            Confirm receipt
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
