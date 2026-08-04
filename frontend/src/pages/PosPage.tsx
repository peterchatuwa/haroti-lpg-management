import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';
import { useOfflineStore } from '../store/offline';

const SIZES = [3, 5, 6, 9, 12, 14, 19, 45];

const PAYMENTS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'AIRTEL_MONEY', label: 'Airtel' },
  { value: 'TNM_MPAMBA', label: 'Mpamba' },
  { value: 'BANK_TRANSFER', label: 'Bank' },
  { value: 'CARD', label: 'Card' },
  { value: 'CUSTOMER_ACCOUNT', label: 'Credit' },
];

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
  const [lastReceipt, setLastReceipt] = useState('');
  const [burst, setBurst] = useState(false);
  const [posMode, setPosMode] = useState<'refill' | 'accessory' | 'bundle'>('refill');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedBundle, setSelectedBundle] = useState('');
  const [accessoryQty, setAccessoryQty] = useState(1);

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => (await api.get('/stations')).data,
  });

  const [selectedStation, setSelectedStation] = useState(stationId);
  const activeStationId = selectedStation || stationId || stations?.[0]?.id;
  const activeStation = (stations ?? []).find(
    (s: { id: string }) => s.id === activeStationId,
  );

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

  const { data: accessories } = useQuery({
    queryKey: ['accessory-catalog'],
    queryFn: async () => (await api.get('/accessories/catalog')).data as Array<{
      id: string;
      sku: string;
      name: string;
      unitPrice: string;
    }>,
  });

  const { data: bundles } = useQuery({
    queryKey: ['pos-bundles'],
    queryFn: async () => (await api.get('/accessories/bundles')).data as Array<{
      id: string;
      sku: string;
      name: string;
      bundlePrice: string;
    }>,
  });

  const accessoryProduct = (accessories ?? []).find((p) => p.id === selectedProduct);
  const bundleProduct = (bundles ?? []).find((b) => b.id === selectedBundle);
  const accessoryTotal = accessoryProduct
    ? Number(accessoryProduct.unitPrice) * accessoryQty
    : 0;
  const bundleTotal = bundleProduct ? Number(bundleProduct.bundlePrice) : 0;

  const isManager =
    user?.role === 'STATION_MANAGER' ||
    user?.role === 'OPERATIONS_MANAGER' ||
    user?.role === 'FINANCE_MANAGER' ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'DIRECTOR';

  const { data: pendingDiscounts } = useQuery({
    queryKey: ['pending-discounts', activeStationId],
    enabled: !!activeStationId && isManager,
    queryFn: async () =>
      (
        await api.get('/sales/pending-discounts', {
          params: { stationId: activeStationId },
        })
      ).data,
  });

  const approveDiscountMutation = useMutation({
    mutationFn: async (saleId: string) =>
      (await api.post(`/sales/${saleId}/approve-discount`)).data,
    onSuccess: () => {
      setMessage('Discount approved — sale completed');
      queryClient.invalidateQueries({ queryKey: ['pending-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const lpgQty = useMemo(
    () => Math.max(0, Number((filledWeight - emptyWeight).toFixed(3))),
    [emptyWeight, filledWeight],
  );
  const pricePerKg = priceData?.pricePerKg ?? 1850;
  const subtotal = Number((lpgQty * pricePerKg).toFixed(2));
  const total =
    posMode === 'accessory'
      ? Math.max(0, Number(accessoryTotal.toFixed(2)))
      : posMode === 'bundle'
        ? Math.max(0, Number(bundleTotal.toFixed(2)))
        : Math.max(0, Number((subtotal - discount).toFixed(2)));

  const discountPercent =
    subtotal > 0 ? Number(((discount / subtotal) * 100).toFixed(1)) : 0;
  const discountNeedsApproval =
    discount > 0 &&
    !user?.canOverridePrice &&
    discountPercent > (user?.discountLimitPercent ?? 0);

  const saleMutation = useMutation({
    mutationFn: async () => {
      if (!shift?.id) {
        throw new Error('Open a shift before recording sales (Shifts page).');
      }
      const clientTxnId = crypto.randomUUID();
      let payload: Record<string, unknown>;

      if (posMode === 'bundle' && selectedBundle) {
        payload = {
          stationId: activeStationId,
          shiftId: shift?.id,
          bundleId: selectedBundle,
          clientTxnId,
          items: [],
          payments: [{ method: paymentMethod, amount: total }],
        };
      } else if (posMode === 'accessory' && selectedProduct) {
        payload = {
          stationId: activeStationId,
          shiftId: shift?.id,
          salesChannel: 'RETAIL_LIST',
          clientTxnId,
          items: [
            {
              productId: selectedProduct,
              itemName: accessoryProduct?.name ?? 'Accessory',
              unitPrice: Number(accessoryProduct?.unitPrice ?? 0),
              quantity: accessoryQty,
            },
          ],
          payments: [{ method: paymentMethod, amount: total }],
        };
      } else {
        payload = {
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
      }

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
      setLastReceipt(data.receiptNumber);
      setMessage(
        data.status === 'PENDING_APPROVAL'
          ? `Awaiting manager approval · ${data.receiptNumber}`
          : data.offline
            ? `Saved offline · ${data.receiptNumber}`
            : `Sale complete · ${data.receiptNumber}`,
      );
      setError('');
      setBurst(true);
      window.setTimeout(() => setBurst(false), 600);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      if (data.status === 'PENDING_APPROVAL') {
        queryClient.invalidateQueries({ queryKey: ['pending-discounts'] });
      }
    },
    onError: (err: { response?: { data?: { message?: string | string[] } } }) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not complete sale');
    },
  });

  function applySize(next: number) {
    setSize(next);
    setEmptyWeight(Number((next * 1.15).toFixed(1)));
    setFilledWeight(Number((next * 1.15 + next).toFixed(1)));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!shift?.id) {
      setError('Open a shift before recording sales');
      return;
    }
    if (!activeStationId) {
      setError('Select a station');
      return;
    }
    if (lpgQty <= 0 && posMode === 'refill') {
      setError('Filled weight must exceed empty weight');
      return;
    }
    if (posMode === 'accessory' && !selectedProduct) {
      setError('Select an accessory');
      return;
    }
    if (posMode === 'bundle' && !selectedBundle) {
      setError('Select a starter kit');
      return;
    }
    saleMutation.mutate();
  }

  return (
    <div className="stack">
      <PageHeader
        title="Unified POS"
        subtitle="LPG refills, accessories & starter kits — single tax invoice (Charter §10.4)"
        action={
          !shift ? (
            <Link className="btn btn-ghost" to="/shifts">
              Open a shift first
            </Link>
          ) : (
            <span className="badge">Shift open</span>
          )
        }
      />

      <div className="pay-chips">
        {(['refill', 'accessory', 'bundle'] as const).map((m) => (
          <button
            key={m}
            type="button"
            className={posMode === m ? 'active' : ''}
            onClick={() => setPosMode(m)}
          >
            {m === 'refill' ? 'LPG Refill' : m === 'accessory' ? 'Accessory' : 'Starter Kit'}
          </button>
        ))}
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
                {(stations ?? []).map(
                  (s: { id: string; code: string; name: string }) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ),
                )}
              </select>
            </label>
          )}

          {posMode === 'refill' && (
            <>
          <div>
            <strong>Cylinder size</strong>
            <div className="quick-sizes" style={{ marginTop: '0.65rem' }}>
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

          <div
            className="grid"
            style={{ gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}
          >
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
            Discount (MWK)
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            {discountNeedsApproval && (
              <small className="badge warn">
                Discount {discountPercent}% exceeds your limit (
                {user?.discountLimitPercent ?? 0}%) — manager approval required
              </small>
            )}
          </label>
            </>
          )}

          {posMode === 'accessory' && (
            <>
              <label>
                Accessory SKU
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">Select…</option>
                  {(accessories ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({formatMoney(Number(p.unitPrice))})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min={1}
                  value={accessoryQty}
                  onChange={(e) => setAccessoryQty(Number(e.target.value))}
                />
              </label>
            </>
          )}

          {posMode === 'bundle' && (
            <label>
              Starter kit
              <select
                value={selectedBundle}
                onChange={(e) => setSelectedBundle(e.target.value)}
              >
                <option value="">Select…</option>
                {(bundles ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {formatMoney(Number(b.bundlePrice))}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div>
            <strong>Payment</strong>
            <div className="pay-chips" style={{ marginTop: '0.55rem' }}>
              {PAYMENTS.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  className={paymentMethod === p.value ? 'active' : ''}
                  onClick={() => setPaymentMethod(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-accent"
            disabled={saleMutation.isPending}
            style={{ fontSize: '1.05rem', padding: '1rem' }}
          >
            {saleMutation.isPending
              ? 'Processing…'
              : `Charge ${formatMoney(total)}`}
          </button>
        </div>

        <div className={`receipt-ticket ${burst ? 'sale-burst' : ''}`}>
          <h3>Haroti Gas</h3>
          <p className="center muted" style={{ margin: '0.2rem 0 1rem' }}>
            {activeStation?.code ?? 'Station'} ·{' '}
            {posMode === 'refill'
              ? 'LPG refill'
              : posMode === 'accessory'
                ? 'Accessory sale'
                : 'Starter kit'}
          </p>
          {posMode === 'refill' && (
            <>
          <div className="receipt-line">
            <span>Cylinder</span>
            <strong>{size} kg</strong>
          </div>
          <div className="receipt-line">
            <span>Empty → Filled</span>
            <strong>
              {emptyWeight} → {filledWeight}
            </strong>
          </div>
          <div className="receipt-line">
            <span>LPG sold</span>
            <strong>{lpgQty.toFixed(3)} kg</strong>
          </div>
          <div className="receipt-line">
            <span>Price / kg</span>
            <strong>{formatMoney(pricePerKg)}</strong>
          </div>
            </>
          )}
          {posMode === 'accessory' && accessoryProduct && (
            <div className="receipt-line">
              <span>{accessoryProduct.name}</span>
              <strong>
                ×{accessoryQty} @ {formatMoney(Number(accessoryProduct.unitPrice))}
              </strong>
            </div>
          )}
          {posMode === 'bundle' && bundleProduct && (
            <div className="receipt-line">
              <span>{bundleProduct.name}</span>
              <strong>{formatMoney(Number(bundleProduct.bundlePrice))}</strong>
            </div>
          )}
          <div className="receipt-line">
            <span>Payment</span>
            <strong>
              {PAYMENTS.find((p) => p.value === paymentMethod)?.label}
            </strong>
          </div>
          {discount > 0 && (
            <div className="receipt-line">
              <span>Discount</span>
              <strong>-{formatMoney(discount)}</strong>
            </div>
          )}
          <div className="receipt-total">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          {lastReceipt && (
            <p className="center muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
              Last receipt: {lastReceipt}
            </p>
          )}
          {!online && (
            <p className="center" style={{ marginTop: '0.75rem', color: 'var(--warn)', fontWeight: 700 }}>
              Offline — sale will sync later
            </p>
          )}
        </div>
      </form>

      {isManager && (pendingDiscounts ?? []).length > 0 && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Pending discount approvals</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Attendant</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pendingDiscounts.map(
                  (s: {
                    id: string;
                    receiptNumber: string;
                    discountAmount: string;
                    totalAmount: string;
                    attendant?: { fullName: string };
                  }) => (
                    <tr key={s.id}>
                      <td>{s.receiptNumber}</td>
                      <td>{s.attendant?.fullName ?? '—'}</td>
                      <td>{formatMoney(s.discountAmount)}</td>
                      <td>{formatMoney(s.totalAmount)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => approveDiscountMutation.mutate(s.id)}
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
