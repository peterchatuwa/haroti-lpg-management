import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg } from '../lib/format';
import { useAuthStore } from '../store/auth';

export function DeliveriesPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(2000);
  const [price, setPrice] = useState(1200);
  const [message, setMessage] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/suppliers')).data,
  });
  const { data: deliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data,
  });

  const { data: calendar } = useQuery({
    queryKey: ['delivery-calendar'],
    queryFn: async () => {
      const start = new Date().toISOString().slice(0, 10);
      const end = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      return (
        await api.get('/deliveries/calendar', { params: { start, end } })
      ).data;
    },
  });

  const { data: allocation } = useQuery({
    queryKey: ['delivery-allocation'],
    queryFn: async () => (await api.get('/deliveries/suggested-allocation')).data,
  });

  const stationId = user?.stationId || stations?.[0]?.id;
  const supplierId = suppliers?.[0]?.id;

  const createMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/deliveries', {
          supplierId,
          stationId,
          deliveryDate: new Date().toISOString().slice(0, 10),
          deliveryNoteNumber: `DN-${Date.now().toString().slice(-6)}`,
          truckRegistration: 'BT 1234',
          driverName: 'James Banda',
          sourceDepot: suppliers?.[0]?.depotName,
          quantityOrderedKg: qty,
          quantityDispatchedKg: qty,
          quantityReceivedKg: qty,
          buyingPricePerKg: price,
          transportCost: 150000,
        })
      ).data,
    onSuccess: (data) => {
      setMessage(`Delivery ${data.deliveryNumber} created — advance workflow to receive stock`);
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });

  const advanceMutation = useMutation({
    mutationFn: (id: string) => api.post(`/deliveries/${id}/advance`),
    onSuccess: () => {
      setMessage('Delivery advanced to next workflow step');
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
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
        title="Supplier deliveries"
        subtitle="Record bulk LPG receipts and update station tank stock"
      />
      {message && <div className="success">{message}</div>}

      <div className="grid two">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Delivery calendar (14 days)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Station</th>
                  <th>Qty (kg)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(calendar ?? []).map(
                  (c: {
                    id: string;
                    deliveryDate: string;
                    station?: { code: string };
                    quantityReceivedKg: string;
                    status: string;
                  }) => (
                    <tr key={c.id}>
                      <td>{c.deliveryDate}</td>
                      <td>{c.station?.code}</td>
                      <td>{formatKg(c.quantityReceivedKg)}</td>
                      <td>{c.status.replaceAll('_', ' ')}</td>
                    </tr>
                  ),
                )}
                {!calendar?.length && (
                  <tr>
                    <td colSpan={4} className="muted">
                      No scheduled deliveries
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Suggested allocation</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Need (kg)</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {(allocation ?? []).map(
                  (a: {
                    stationId: string;
                    stationCode: string;
                    needKg: string;
                    priority: number;
                  }) => (
                    <tr key={a.stationId}>
                      <td>{a.stationCode}</td>
                      <td>{formatKg(a.needKg)}</td>
                      <td>{a.priority}</td>
                    </tr>
                  ),
                )}
                {!allocation?.length && (
                  <tr>
                    <td colSpan={3} className="muted">
                      All stations adequately stocked
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid two">
        <form className="panel stack" onSubmit={onSubmit}>
          <h3 style={{ marginTop: 0 }}>Receive delivery</h3>
          <label>
            Quantity received (kg)
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Buying price / kg
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </label>
          <button className="btn btn-primary" disabled={createMutation.isPending || !supplierId}>
            Post delivery
          </button>
        </form>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Recent deliveries</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Station</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(deliveries ?? []).map(
                  (d: {
                    id: string;
                    deliveryNumber: string;
                    status: string;
                    quantityReceivedKg: string;
                    station?: { code: string };
                  }) => (
                    <tr key={d.id}>
                      <td>{d.deliveryNumber}</td>
                      <td>{d.station?.code}</td>
                      <td>
                        <span className="badge">{d.status.replaceAll('_', ' ')}</span>
                      </td>
                      <td>{formatKg(d.quantityReceivedKg)}</td>
                      <td>
                        {d.status !== 'INVENTORY_UPDATED' &&
                          d.status !== 'ACCOUNTS_PAYABLE' &&
                          d.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => advanceMutation.mutate(d.id)}
                            >
                              Advance
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
