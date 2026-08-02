import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';
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
      setMessage(`Delivery ${data.deliveryNumber} received and stock updated`);
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
      <div className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <h2>Supplier deliveries</h2>
          <p>Record bulk LPG receipts and update station tank stock</p>
        </div>
      </div>
      {message && <div className="success">{message}</div>}

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
                  <th>Received</th>
                  <th>Buy price</th>
                </tr>
              </thead>
              <tbody>
                {(deliveries ?? []).map(
                  (d: {
                    id: string;
                    deliveryNumber: string;
                    quantityReceivedKg: string;
                    buyingPricePerKg: string;
                    station?: { code: string };
                  }) => (
                    <tr key={d.id}>
                      <td>{d.deliveryNumber}</td>
                      <td>{d.station?.code}</td>
                      <td>{formatKg(d.quantityReceivedKg)}</td>
                      <td>{formatMoney(d.buyingPricePerKg)}</td>
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
