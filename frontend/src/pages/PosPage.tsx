import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';
import { useOfflineStore } from '../store/offline';

const SIZES = [3, 5, 6, 9, 12, 14, 19, 45];

export function PosPage() {
  const user = useAuthStore((s) => s.user);
  const online = useOfflineStore((s) => s.online);
  const enqueue = useOfflineStore((s) => s.enqueue);
  const queryClient = useQueryClient();
  const stationId = user?.stationId ?? '';

  const [size, setSize] = useState(12);
  const [emptyWeight, setEmptyWeight] = useState(14.2);
  const [filledWeight, setFilledWeight] = useState(26.2);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });

  const [selectedStation, setSelectedStation] = useState(stationId);

  const activeStationId = selectedStation || stationId || stations?.[0]?.id;

  const { data: priceData } = useQuery({
    queryKey: ['price', activeStationId],
    enabled: !!activeStationId,
    queryFn: async () =>
      (await api.get(`/sales/price/${activeStationId}`)).data as {
        pricePerKg: number;
      },
  });

  const { data: shift } = useQuery({
    queryKey: ['current-shift', activeStationId],
    enabled: !!activeStationId,
    queryFn: async () =>
      (await api.get('/shifts/current', { params: { stationId: activeStationId } }))
        .data,
  });

  const lpgQty = useMemo(
    () => Math.max(0, Number((filledWeight - emptyWeight).toFixed(3))),
    [emptyWeight, filledWeight],
  );
  const pricePerKg = priceData?.pricePerKg ?? 1850;
  const subtotal = Number((lpgQty * pricePerKg).toFixed(2));
  const total = Math.max(0, Number((subtotal - discount).toFixed(2)));

  const saleMutation = useMutation({
    mutationFn: async () => {
      const clientTxnId = crypto.randomUUID();
      const payload = {
        stationId: activeStationId,
        shiftId: shift?.id,
        discountAmount: discount,
        clientTxnId,
        items: [
          {
            itemName: `${size} kg LPG Refill`,
            cylinderSizeKg: size,
            emptyWeightKg: emptyWeight,
            filledWeightKg: filledWeight,
            lpgQuantityKg: lpgQty,
            unitPrice: pricePerKg,
            quantity: 1,
          },
        ],
        payments: [{ method: paymentMethod, amount: total }],
      };

      if (!online) {
        enqueue({
          clientTxnId,
          payload,
          createdAt: new Date().toISOString(),
          synced: false,
        });
        return { offline: true, receiptNumber: `OFF-${clientTxnId.slice(0, 8)}` };
      }

      const { data } = await api.post('/sales', payload);
      return data;
    },
    onSuccess: (data) => {
      setMessage(
        data.offline
          ? `Saved offline as ${data.receiptNumber}. Will sync when online.`
          : `Sale completed · Receipt ${data.receiptNumber}`,
      );
      setError('');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: () => setError('Could not complete sale'),
  });

  function applySize(next: number) {
    setSize(next);
    setEmptyWeight(Number((next * 1.15).toFixed(1)));
    setFilledWeight(Number((next * 1.15 + next).toFixed(1)));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeStationId) {
      setError('Select a station');
      return;
    }
    if (lpgQty <= 0) {
      setError('Filled weight must exceed empty weight');
      return;
    }
    saleMutation.mutate();
  }

  return (
    <div className="stack">
      <div className="topbar" style={{ marginBottom: 0 }}>
        <div>
          <h2>Refill POS</h2>
          <p>Fast cylinder refill sales with weight-based LPG calculation</p>
        </div>
      </div>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <form className="grid two" onSubmit={onSubmit}>
        <div className="panel stack">
          {!stationId && (
            <label>
              Station
              <select
                value={activeStationId}
                onChange={(e) => setSelectedStation(e.target.value)}
              >
                {(stations ?? []).map((s: { id: string; code: string; name: string }) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <strong>Quick cylinder sizes</strong>
            <div className="quick-sizes" style={{ marginTop: '0.6rem' }}>
              {SIZES.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={size === s ? 'active' : ''}
                  onClick={() => applySize(s)}
                >
                  {s} kg
                </button>
              ))}
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <label>
              Empty weight (kg)
              <input
                type="number"
                step="0.01"
                value={emptyWeight}
                onChange={(e) => setEmptyWeight(Number(e.target.value))}
                required
              />
            </label>
            <label>
              Filled weight (kg)
              <input
                type="number"
                step="0.01"
                value={filledWeight}
                onChange={(e) => setFilledWeight(Number(e.target.value))}
                required
              />
            </label>
          </div>

          <label>
            Payment method
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
              <option value="TNM_MPAMBA">TNM Mpamba</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CARD">Card</option>
              <option value="CUSTOMER_ACCOUNT">Customer account</option>
            </select>
          </label>

          <label>
            Discount (MWK)
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </label>

          <button className="btn btn-accent" disabled={saleMutation.isPending}>
            {saleMutation.isPending ? 'Processing…' : 'Complete sale'}
          </button>
          {!shift && (
            <p className="muted">
              Tip: open a shift first for proper cash reconciliation.
            </p>
          )}
        </div>

        <div className="panel stack">
          <h3 style={{ marginTop: 0 }}>Sale summary</h3>
          <div className="stat-card">
            <h3>LPG quantity</h3>
            <div className="value">{lpgQty.toFixed(3)} kg</div>
            <div className="hint">
              Filled {filledWeight} − Empty {emptyWeight}
            </div>
          </div>
          <div className="stat-card">
            <h3>Price / kg</h3>
            <div className="value">{formatMoney(pricePerKg)}</div>
            <div className="hint">Head-office controlled price</div>
          </div>
          <div className="stat-card">
            <h3>Total due</h3>
            <div className="value">{formatMoney(total)}</div>
            <div className="hint">
              Subtotal {formatMoney(subtotal)}
              {discount > 0 ? ` − discount ${formatMoney(discount)}` : ''}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
