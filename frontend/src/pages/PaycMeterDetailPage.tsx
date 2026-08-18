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
  valveOpen?: boolean | null;
  batteryVoltage?: string | null;
  cumulativeFlow?: string | null;
  vendorReadTime?: string;
  customer?: { id: string; fullName: string; phone?: string };
  station?: { id: string; name: string; code: string };
}

interface VendorSnapshot {
  realtime?: {
    balance: number;
    battery?: string;
    cumulantFlow?: string;
    valve?: number;
    readTime?: string;
    customerName?: string;
    customerPhone?: string;
  };
  valveStatus?: { valveStatus?: string };
  valveRecords?: Array<{
    dateTime?: string;
    resultInfo?: string;
    status?: string;
  }>;
  consumptionHistory?: Array<{
    readTime?: string;
    consumption?: number;
    reading?: string;
  }>;
}

interface PaycCommandRow {
  id: string;
  commandType: string;
  status: string;
  vendorValueId?: string;
  message?: string;
  createdAt: string;
  requestedBy?: { fullName: string };
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

  const { data: vendor } = useQuery({
    queryKey: ['payc-vendor-snapshot', id],
    enabled: !!id && !!meter?.imei,
    queryFn: async () => (await api.get<VendorSnapshot>(`/payc/meters/${id}/vendor`)).data,
    retry: 1,
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

  const { data: commands } = useQuery({
    queryKey: ['payc-commands', id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<PaycCommandRow[]>(`/payc/meters/${id}/commands`)).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list-payc'],
    queryFn: async () =>
      (await api.get<Array<{ id: string; fullName: string; phone?: string }>>('/customers'))
        .data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payc-meter', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-vendor-snapshot', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-telemetry', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-credits', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-commands', id] });
    queryClient.invalidateQueries({ queryKey: ['payc-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['payc-meters'] });
  };

  const syncMutation = useMutation({
    mutationFn: async () => (await api.post(`/payc/meters/${id}/sync-vendor`)).data,
    onSuccess: () => {
      setMessage('Synced from Zhongyi');
      setError('');
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
      (await api.post(`/payc/meters/${id}/valve`, { open })).data as {
        vendorValueId?: string;
        message?: string;
      },
    onSuccess: (data, open) => {
      setMessage(
        data.message ??
          (open ? 'Open valve command queued on Zhongyi' : 'Close valve command queued on Zhongyi'),
      );
      setError('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Valve command failed'),
  });

  const commandMutation = useMutation({
    mutationFn: async (command: 'queryFlowAndStatus' | 'queryBattery') =>
      (await api.post(`/payc/meters/${id}/command`, { command })).data as {
        vendorValueId?: string;
        message?: string;
      },
    onSuccess: (data) => {
      setMessage(data.message ?? 'Device command queued — check command log for result');
      setError('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      setError(err.response?.data?.message ?? 'Command failed'),
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

  const valveLabel =
    meter.valveOpen === true
      ? 'Open'
      : meter.valveOpen === false
        ? 'Closed'
        : vendor?.realtime?.valve === 1
          ? 'Open'
          : vendor?.realtime?.valve === 0
            ? 'Closed'
            : 'Unknown';

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

      {message && <p className="panel" style={{ color: 'var(--ok)', margin: 0 }}>{message}</p>}
      {error && <p className="panel" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}

      {(meter.status === 'LOW_CREDIT' || meter.status === 'OFFLINE') && (
        <div className="panel warn">
          <strong>Alert: {meter.status.replaceAll('_', ' ')}</strong>
          <p className="muted" style={{ margin: '0.35rem 0 0' }}>
            {meter.status === 'LOW_CREDIT' &&
              'Credit is below threshold. Top up or the valve may close automatically.'}
            {meter.status === 'OFFLINE' &&
              'No recent telemetry from Zhongyi. Sync or check device connectivity.'}
          </p>
        </div>
      )}

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Credit</h3>
          <div className="value">{formatKg(Number(meter.creditBalanceKg))}</div>
          <div className="hint">{formatMoney(Number(meter.deferredRevenue))} deferred</div>
        </div>
        <div className="panel stat-card">
          <h3>Valve</h3>
          <div className="value" style={{ fontSize: '1.1rem' }}>{valveLabel}</div>
          <div className="hint">
            {vendor?.valveStatus?.valveStatus
              ? `Vendor: ${vendor.valveStatus.valveStatus}`
              : 'Remote control via Zhongyi'}
          </div>
        </div>
        <div className="panel stat-card">
          <h3>Daily burn</h3>
          <div className="value">{formatKg(Number(meter.dailyBurnKg))}</div>
          {meter.cumulativeFlow && (
            <div className="hint">Total flow {Number(meter.cumulativeFlow).toFixed(3)}</div>
          )}
        </div>
        <div className="panel stat-card">
          <h3>Device</h3>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {meter.batteryVoltage ? `${meter.batteryVoltage}V` : vendor?.realtime?.battery ? `${vendor.realtime.battery}V` : '—'}
          </div>
          <div className="hint">
            {meter.lastTelemetryAt
              ? `Last seen ${new Date(meter.lastTelemetryAt).toLocaleString()}`
              : 'Sync to refresh'}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="panel stack">
          <h3 className="panel-title">Meter control</h3>
          <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Valve and device commands are sent to Zhongyi. Battery-powered meters may take a few
            minutes to respond.
          </p>
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
              className="btn btn-accent"
              disabled={valveMutation.isPending || !meter.imei}
              onClick={() => {
                if (window.confirm(`Open valve on meter ${meter.meterSerial}?`)) {
                  valveMutation.mutate(true);
                }
              }}
            >
              Open valve
            </button>
            <button
              type="button"
              className="btn"
              disabled={valveMutation.isPending || !meter.imei}
              onClick={() => {
                if (window.confirm(`Close valve on meter ${meter.meterSerial}?`)) {
                  valveMutation.mutate(false);
                }
              }}
            >
              Close valve
            </button>
          </div>
          <div className="pay-chips">
            <button
              type="button"
              className="btn"
              disabled={commandMutation.isPending || !meter.imei}
              onClick={() => commandMutation.mutate('queryFlowAndStatus')}
            >
              Query flow &amp; status
            </button>
            <button
              type="button"
              className="btn"
              disabled={commandMutation.isPending || !meter.imei}
              onClick={() => commandMutation.mutate('queryBattery')}
            >
              Query battery
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
        </div>
      </div>

      {vendor && (
        <div className="panel">
          <h3 className="panel-title">Live Zhongyi data</h3>
          <div className="grid two">
            <div>
              <p className="muted" style={{ margin: 0 }}>Balance (MWK)</p>
              <strong>{formatMoney(Number(vendor.realtime?.balance ?? 0))}</strong>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Vendor read time</p>
              <strong>{vendor.realtime?.readTime ?? '—'}</strong>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Customer on meter</p>
              <strong>{vendor.realtime?.customerName ?? '—'}</strong>
            </div>
            <div>
              <p className="muted" style={{ margin: 0 }}>Cumulative flow</p>
              <strong>{vendor.realtime?.cumulantFlow ?? '—'}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <h3 className="panel-title">Command log</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Command</th>
                <th>Status</th>
                <th>By</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {(commands ?? []).map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.createdAt).toLocaleString()}</td>
                  <td>{c.commandType.replaceAll('_', ' ')}</td>
                  <td>
                    <span className="badge">{c.status}</span>
                  </td>
                  <td>{c.requestedBy?.fullName ?? '—'}</td>
                  <td className="muted">{c.message ?? c.vendorValueId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!commands?.length && (
          <p className="muted">No commands sent yet.</p>
        )}
      </div>

      {vendor?.valveRecords && vendor.valveRecords.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Valve history (Zhongyi)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {vendor.valveRecords.map((r, i) => (
                  <tr key={i}>
                    <td>{r.dateTime ?? '—'}</td>
                    <td>{r.resultInfo ?? '—'}</td>
                    <td>{r.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
