import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg } from '../lib/format';
import { useAuthStore } from '../store/auth';

export function InventoryPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(-1);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });

  const stationId = user?.stationId || stations?.[0]?.id;

  const { data: position } = useQuery({
    queryKey: ['stock-position', stationId],
    enabled: !!stationId,
    queryFn: async () => (await api.get(`/inventory/position/${stationId}`)).data,
  });

  const { data: movements } = useQuery({
    queryKey: ['movements', stationId],
    enabled: !!stationId,
    queryFn: async () =>
      (await api.get('/inventory/movements', { params: { stationId } })).data,
  });

  const adjustMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/inventory/adjust', {
          stationId,
          quantityKg: qty,
          reason,
          clientTxnId: crypto.randomUUID(),
        })
      ).data,
    onSuccess: () => {
      setMessage('Stock adjustment recorded');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['stock-position'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });

  function onAdjust(e: FormEvent) {
    e.preventDefault();
    adjustMutation.mutate();
  }

  return (
    <div className="stack">
      <PageHeader
        title="LPG inventory"
        subtitle="Track stock movements and expected versus physical closing stock"
      />
      {message && <div className="success">{message}</div>}

      <div className="grid stats">
        <div className="panel stat-card">
          <h3>Physical stock</h3>
          <div className="value">{formatKg(position?.physicalClosingStockKg)}</div>
        </div>
        <div className="panel stat-card">
          <h3>Expected stock</h3>
          <div className="value">{formatKg(position?.expectedClosingStockKg)}</div>
        </div>
        <div className="panel stat-card">
          <h3>Variance</h3>
          <div className="value">{formatKg(position?.stockVarianceKg)}</div>
        </div>
        <div className="panel stat-card">
          <h3>Sold</h3>
          <div className="value">{formatKg(position?.components?.soldKg)}</div>
        </div>
      </div>

      <div className="grid two">
        <form className="panel stack" onSubmit={onAdjust}>
          <h3 style={{ marginTop: 0 }}>Stock adjustment</h3>
          <label>
            Quantity (kg, negative to reduce)
            <input
              type="number"
              step="0.001"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Reason
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={5}
              rows={3}
            />
          </label>
          <button className="btn btn-primary" disabled={adjustMutation.isPending}>
            Post adjustment
          </button>
        </form>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Recent movements</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {(movements ?? []).slice(0, 12).map(
                  (m: {
                    id: string;
                    type: string;
                    quantityKg: string;
                    stockAfterKg: string;
                  }) => (
                    <tr key={m.id}>
                      <td>{m.type.replaceAll('_', ' ')}</td>
                      <td>{formatKg(m.quantityKg)}</td>
                      <td>{formatKg(m.stockAfterKg)}</td>
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
