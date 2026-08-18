import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';

interface PaycMeterDetail {
  id: string;
  meterSerial: string;
  imei?: string;
  creditBalanceKg: string;
  deferredRevenue: string;
  dailyBurnKg: string;
  status: string;
  cylinderSerial?: string;
  location?: string;
  lastTelemetryAt?: string;
  customer?: { id: string; fullName: string; phone?: string };
  station?: { id: string; name: string; code: string };
}

export function PaycMeterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState(5000);
  const [topupMethod, setTopupMethod] = useState<'CASH' | 'PAYCHANGU'>('CASH');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paychanguOperator, setPaychanguOperator] = useState<'AIRTEL_MONEY' | 'TNM_MPAMBA'>(
    'AIRTEL_MONEY',
  );
  const [cylinderSerial, setCylinderSerial] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: meter, isLoading } = useQuery({
    queryKey: ['payc-meter', id],
    enabled: !!id,
    queryFn: async () => (await api.get<PaycMeterDetail>(`/payc/meters/${id}`)).data,
  });

  const { data: telemetry } = useQuery({
    queryKey: ['payc-telemetry', id],
    enabled: !!id,
    queryFn: async () =>
      (
        await api.get<
          Array<{
            recordedAt: string;
            burnKg: string;
            creditRemainingKg: string;
            valveOpen: boolean;
          }>
        >(`/payc/meters/${id}/telemetry`)
      ).data,
  });

  const { data: credits } = useQuery({
    queryKey: ['payc-credits', id],
    enabled: !!id,
    queryFn: async () =>
      (
        await api.get<
          Array<{
            createdAt: string;
            type: string;
            amountMwk: string;
            creditKg: string;
            paymentMethod?: string;
          }>
        >(`/payc/meters/${id}/credits`)
      ).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list-payc'],
    queryFn: async () =>
      (await api.get<Array<{ id: string; fullName: string; phone?: string }>>('/customers'))
        .data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payc-meter', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-telemetry', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-credits', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['payc-meters'] });
  };

  const syncMutation = useMutation({
    mutationFn: async () => (await api.post(`/payc/meters/${id}/sync-vendor`)).data,
    onSuccess: () => {
      setMessage('Synced from Zhongyi');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Sync failed'),
  });

  const topupMutation = useMutation({
    mutationFn: async () => {
      if (topupMethod === 'PAYCHANGU') {
        if (!customerPhone.trim()) throw new Error('Enter customer mobile for PayChangu');
        const { data } = await api.post('/paychangu/initiate', {
          amount: topupAmount,
          paymentMethod: paychanguOperator,
          customerPhone: customerPhone.trim(),
          internalRef: `PAYC-${meter?.meterSerial}-${Date.now()}`,
          paycMeterId: id,
        });
        return data;
      }
      return (
        await api.post(`/payc/meters/${id}/topup`, {
          amountMwk: topupAmount,
          paymentMethod: topupMethod,
        })
      ).data;
    },
    onSuccess: (data) => {
      setMessage(
        topupMethod === 'PAYCHANGU'
          ? `PayChangu prompt sent — ref ${data.transactionRef ?? 'pending'}`
          : 'Top-up recorded and sent to meter',
      );
      setError('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) =>
      setError(err.response?.data?.message ?? err.message ?? 'Top-up failed'),
  });

  const valveMutation = useMutation({
    mutationFn: async (open: boolean) =>
      (await api.post(`/payc/meters/${id}/valve`, { open })).data,
    onSuccess: (_, open) => {
      setMessage(open ? 'Valve open command sent' : 'Valve close command sent');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Valve command failed'),
  });

  const assignMutation = useMutation({
    mutationFn: async (customerId: string | null) =>
      (await api.patch(`/payc/meters/${id}`, { customerId: customerId || null })).data,
    onSuccess: () => {
      setMessage('Customer assignment updated');
      invalidate();
    },
  });

  const rebindMutation = useMutation({
    mutationFn: async () =>
      (await api.post(`/payc/meters/${id}/rebind-cylinder`, {
        cylinderSerial: cylinderSerial.trim(),
      })).data,
    onSuccess: () => {
      setMessage('Cylinder linked');
      setCylinderSerial('');
      invalidate();
    },
  });

  if (isLoading || !meter) {
    return <div className="panel">Loading meter…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title={meter.meterSerial}
        subtitle={`PAYC smart meter · IMEI ${meter.imei ?? '—'}`}
        action={
          <Link to="/payc" className="btn">
            ← Back to fleet
          </Link>
        }
      />

      {message && <p className="panel" style={{ color: 'var(--ok)' }}>{message}</p>}
      {error && <p className="panel" style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Credit</h3>
          <div className="value">{formatKg(Number(meter.creditBalanceKg))}</div>
          <div className="hint">{formatMoney(Number(meter.deferredRevenue))} deferred</div>
        </div>
        <div className="panel stat-card">
          <h3>Daily burn</h3>
          <div className="value">{formatKg(Number(meter.dailyBurnKg))}</div>
        </div>
        <div className="panel stat-card">
          <h3>Status</h3>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {meter.status.replaceAll('_', ' ')}
          </div>
          <div className="hint">
            {meter.lastTelemetryAt
              ? `Last seen ${new Date(meter.lastTelemetryAt).toLocaleString()}`
              : 'No telemetry yet'}
          </div>
        </div>
        <div className="panel stat-card">
          <h3>Cylinder</h3>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {meter.cylinderSerial ?? '—'}
          </div>
          <div className="hint">{meter.location ?? 'No location'}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="panel stack">
          <h3 className="panel-title">Operations</h3>
          <button
            type="button"
            className="btn btn-primary"
            disabled={syncMutation.isPending || !meter.imei}
            onClick={() => syncMutation.mutate()}
          >
            {syncMutation.isPending ? 'Syncing…' : 'Sync from Zhongyi'}
          </button>
          <div className="pay-chips">
            <button
              type="button"
              className="btn"
              disabled={valveMutation.isPending}
              onClick={() => valveMutation.mutate(true)}
            >
              Open valve
            </button>
            <button
              type="button"
              className="btn"
              disabled={valveMutation.isPending}
              onClick={() => valveMutation.mutate(false)}
            >
              Close valve
            </button>
          </div>
          <label>
            Link ERP customer
            <select
              value={meter.customer?.id ?? ''}
              onChange={(e) =>
                assignMutation.mutate(e.target.value ? e.target.value : null)
              }
            >
              <option value="">— Unassigned —</option>
              {(customers ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                  {c.phone ? ` · ${c.phone}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rebind cylinder serial
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={cylinderSerial}
                onChange={(e) => setCylinderSerial(e.target.value)}
                placeholder={meter.cylinderSerial ?? 'Cylinder serial'}
              />
              <button
                type="button"
                className="btn"
                disabled={!cylinderSerial.trim() || rebindMutation.isPending}
                onClick={() => rebindMutation.mutate()}
              >
                Save
              </button>
            </div>
          </label>
        </div>

        <div className="panel stack">
          <h3 className="panel-title">Top up credit</h3>
          <label>
            Amount (MWK)
            <input
              type="number"
              min={100}
              step={100}
              value={topupAmount}
              onChange={(e) => setTopupAmount(Number(e.target.value))}
            />
          </label>
          <div className="pay-chips">
            {(['CASH', 'PAYCHANGU'] as const).map((m) => (
              <button
                type="button"
                key={m}
                className={topupMethod === m ? 'active' : ''}
                onClick={() => setTopupMethod(m)}
              >
                {m === 'CASH' ? 'Cash' : 'PayChangu'}
              </button>
            ))}
          </div>
          {topupMethod === 'PAYCHANGU' && (
            <>
              <label>
                Customer mobile
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0990000000"
                />
              </label>
              <div className="pay-chips">
                {(
                  [
                    { value: 'AIRTEL_MONEY', label: 'Airtel' },
                    { value: 'TNM_MPAMBA', label: 'Mpamba' },
                  ] as const
                ).map((op) => (
                  <button
                    type="button"
                    key={op.value}
                    className={paychanguOperator === op.value ? 'active' : ''}
                    onClick={() => setPaychanguOperator(op.value)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            className="btn btn-accent"
            disabled={topupMutation.isPending}
            onClick={() => topupMutation.mutate()}
          >
            {topupMutation.isPending
              ? 'Processing…'
              : `Top up ${formatMoney(topupAmount)}`}
          </button>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Cash top-ups post to GL and push credit to the Zhongyi meter immediately.
            PayChangu completes after payment confirmation.
          </p>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Recent telemetry</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Burn (kg)</th>
                <th>Credit left</th>
                <th>Valve</th>
              </tr>
            </thead>
            <tbody>
              {(telemetry ?? []).map((t) => (
                <tr key={t.recordedAt}>
                  <td>{new Date(t.recordedAt).toLocaleString()}</td>
                  <td>{formatKg(Number(t.burnKg))}</td>
                  <td>{formatKg(Number(t.creditRemainingKg))}</td>
                  <td>{t.valveOpen ? 'Open' : 'Closed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Credit ledger</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>MWK</th>
                <th>kg</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {(credits ?? []).map((c) => (
                <tr key={c.createdAt + c.type}>
                  <td>{new Date(c.createdAt).toLocaleString()}</td>
                  <td>{c.type}</td>
                  <td>{formatMoney(Number(c.amountMwk))}</td>
                  <td>{formatKg(Number(c.creditKg))}</td>
                  <td>{c.paymentMethod?.replaceAll('_', ' ') ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
