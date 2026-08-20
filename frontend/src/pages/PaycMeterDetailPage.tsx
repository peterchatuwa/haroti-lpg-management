import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import {
  PaymentStatusBanner,
  paychanguStatusToBanner,
  type PaymentStatusInfo,
} from '../components/PaymentStatusBanner';
import api from '../lib/api';
import { confirmAction } from '../lib/confirm';
import { formatKg, formatMoney } from '../lib/format';
import {
  notifyPaymentStatus,
  paymentToast,
  toast,
  txnToast,
} from '../lib/toast';

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
  flatPriceMwkPerKg?: number | null;
  priceName?: string | null;
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

const PAYC_TXN_LABELS: Record<string, string> = {
  TOPUP: 'Payment received',
  BURN: 'Gas consumed',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
};

function commandStatusLabel(status: string) {
  if (status === 'SUCCESS' || status === 'COMPLETED') return 'Completed';
  if (status === 'FAILED') return 'Failed';
  return 'Pending';
}

function commandMessageNeedsRepair(message?: string) {
  return /please wait|recharging|successful delivery|^successful$/i.test((message ?? '').trim());
}

function commandDisplayMessage(command: PaycCommandRow) {
  if (
    (command.status === 'SUCCESS' || command.status === 'COMPLETED') &&
    commandMessageNeedsRepair(command.message)
  ) {
    if (command.commandType === 'remotelyTopUp') {
      const match = command.message?.match(/top-up (\d+(?:\.\d+)?) MWK \(([\d.]+) kg/i);
      if (match) return `Top-up delivered — ${match[2]} kg credited (${match[1]} MWK)`;
      return 'Top-up delivered to meter';
    }
    if (command.commandType === 'VALVE_OPEN') return 'Valve opened successfully';
    if (command.commandType === 'VALVE_CLOSE') return 'Valve closed successfully';
    if (command.commandType === 'QUERYFLOWANDSTATUS') return 'Flow and status read completed';
    if (command.commandType === 'QUERYBATTERY') return 'Battery query completed';
    return 'Command completed successfully';
  }
  if (command.status === 'PENDING' && commandMessageNeedsRepair(command.message)) {
    return 'Waiting for meter response…';
  }
  return command.message ?? command.vendorValueId ?? '—';
}

function commandNeedsRefresh(command: PaycCommandRow) {
  return command.status === 'PENDING' || commandMessageNeedsRepair(command.message);
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
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusInfo | null>(null);
  const [awaitingPayment, setAwaitingPayment] = useState<{
    transactionRef: string;
    amount: number;
  } | null>(null);
  const paymentPollRef = useRef(false);

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
            reference?: string;
          }>
        >(`/payc/meters/${id}/credits`)
      ).data,
  });

  const { data: commands, refetch: refetchCommands } = useQuery({
    queryKey: ['payc-commands', id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<PaycCommandRow[]>(`/payc/meters/${id}/commands`)).data,
  });

  const hasActiveCommands = useMemo(
    () => (commands ?? []).some(commandNeedsRefresh),
    [commands],
  );

  useEffect(() => {
    if (!id || !hasActiveCommands) return;

    let cancelled = false;
    const refreshCommands = async () => {
      try {
        const { data } = await api.post<{ commands: PaycCommandRow[] }>(
          `/payc/meters/${id}/commands/refresh`,
        );
        if (!cancelled && data.commands) {
          queryClient.setQueryData(['payc-commands', id], data.commands);
        }
      } catch {
        if (!cancelled) void refetchCommands();
      }
    };

    void refreshCommands();
    const intervalId = window.setInterval(refreshCommands, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [id, hasActiveCommands, queryClient, refetchCommands]);

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
    onMutate: () => txnToast.processing('Syncing meter from Zhongyi…'),
    onSuccess: () => {
      txnToast.success('Meter synced', { detail: 'Latest readings pulled from Zhongyi' });
      setMessage('Synced from Zhongyi');
      setError('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const detail = err.response?.data?.message ?? 'Sync failed';
      txnToast.failed('Sync failed', { detail });
      setError(detail);
    },
  });

  const topupMutation = useMutation({
    onMutate: () => {
      if (topupMethod === 'PAYCHANGU') {
        paymentToast.processing('Initiating PayChangu top-up…', {
          detail: `${formatMoney(topupAmount)} for meter ${meter?.meterSerial ?? ''}`.trim(),
        });
        return;
      }
      txnToast.processing('Sending top-up to meter…', {
        detail: `${formatMoney(topupAmount)} via ${topupMethod.replace(/_/g, ' ')}`,
      });
    },
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
      if (topupMethod === 'PAYCHANGU' && data.transactionRef) {
        setAwaitingPayment({
          transactionRef: data.transactionRef,
          amount: topupAmount,
        });
        const waitingStatus: PaymentStatusInfo = {
          state: 'waiting',
          title: 'Waiting for PayChangu',
          detail: 'Approve the mobile money prompt on the customer phone.',
          reference: data.transactionRef,
        };
        setPaymentStatus(waitingStatus);
        notifyPaymentStatus(waitingStatus);
        setMessage('');
        setError('');
        return;
      }
      txnToast.dismiss();
      paymentToast.dismiss();
      setPaymentStatus(null);
      txnToast.success('Top-up complete', {
        detail: `${formatMoney(topupAmount)} recorded and sent to meter`,
      });
      setMessage('Top-up recorded and sent to meter');
      setError('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } }; message?: string }) => {
      const detail = err.response?.data?.message ?? err.message ?? 'Top-up failed';
      if (topupMethod === 'PAYCHANGU') {
        paymentToast.failed('Top-up failed', { detail });
      } else {
        txnToast.failed('Top-up failed', { detail });
      }
      setError(detail);
    },
  });

  useEffect(() => {
    if (!awaitingPayment) return;

    let cancelled = false;
    paymentPollRef.current = true;

    const pollPayment = async () => {
      try {
        const { data } = await api.get(
          `/paychangu/transaction/${awaitingPayment.transactionRef}`,
        );
        if (cancelled) return;
        const banner = paychanguStatusToBanner(data.status, {
          amount: awaitingPayment.amount,
          reference: data.transactionRef,
          failureReason: data.metadata?.failure_reason,
        });
        if (data.status === 'COMPLETED') {
          setAwaitingPayment(null);
          const status =
            banner ?? {
              state: 'success' as const,
              title: 'Payment successful',
              detail: `${formatMoney(awaitingPayment.amount)} credited to meter and Zhongyi.`,
              reference: data.transactionRef,
            };
          setPaymentStatus(status);
          notifyPaymentStatus(status);
          setMessage('');
          setError('');
          invalidate();
        } else if (
          data.status === 'FAILED' ||
          data.status === 'CANCELLED' ||
          data.status === 'EXPIRED'
        ) {
          setAwaitingPayment(null);
          const status =
            banner ?? {
              state: 'failed' as const,
              title: 'Payment failed',
              detail: 'PayChangu payment was not completed.',
              reference: data.transactionRef,
            };
          setPaymentStatus(status);
          notifyPaymentStatus(status);
          setMessage('');
          setError('');
        } else if (banner) {
          setPaymentStatus(banner);
          if (banner.detail) paymentToast.updateDetail(banner.detail);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          (err as { response?: { data?: { message?: string | string[] } } })
            .response?.data?.message;
        setAwaitingPayment(null);
        const status: PaymentStatusInfo = {
          state: 'failed',
          title: 'Payment failed',
          detail: Array.isArray(msg) ? msg.join(', ') : msg ?? 'Could not verify payment',
        };
        setPaymentStatus(status);
        notifyPaymentStatus(status);
        setMessage('');
        setError('');
      }
    };

    void pollPayment();
    const intervalId = window.setInterval(pollPayment, 3000);
    const timeoutId = window.setTimeout(() => {
      if (!cancelled && paymentPollRef.current) {
        setAwaitingPayment(null);
        const pendingStatus: PaymentStatusInfo = {
          state: 'waiting',
          title: 'Payment still pending',
          detail:
            'PayChangu has not confirmed yet. The system will keep checking automatically.',
          reference: awaitingPayment.transactionRef,
        };
        setPaymentStatus(pendingStatus);
        notifyPaymentStatus(pendingStatus);
        setMessage('');
        setError('');
      }
    }, 120_000);

    return () => {
      cancelled = true;
      paymentPollRef.current = false;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [awaitingPayment, queryClient]);

  const valveMutation = useMutation({
    mutationFn: async (open: boolean) =>
      (await api.post(`/payc/meters/${id}/valve`, { open })).data as {
        vendorValueId?: string;
        message?: string;
      },
    onMutate: (open) =>
      txnToast.processing(open ? 'Opening valve…' : 'Closing valve…'),
    onSuccess: (data, open) => {
      const detail =
        data.message ??
        (open ? 'Open valve command queued on Zhongyi' : 'Close valve command queued on Zhongyi');
      txnToast.success(open ? 'Valve open queued' : 'Valve close queued', { detail });
      setMessage(detail);
      setError('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const detail = err.response?.data?.message ?? 'Valve command failed';
      txnToast.failed('Valve command failed', { detail });
      setError(detail);
    },
  });

  const commandMutation = useMutation({
    mutationFn: async (command: 'queryFlowAndStatus' | 'queryBattery') =>
      (await api.post(`/payc/meters/${id}/command`, { command })).data as {
        vendorValueId?: string;
        message?: string;
        instant?: boolean;
        command?: { status?: string };
      },
    onMutate: (command) =>
      txnToast.processing(
        command === 'queryFlowAndStatus'
          ? 'Reading flow and status from Zhongyi…'
          : 'Sending device command…',
      ),
    onSuccess: (data) => {
      const detail = data.message ?? 'Device command queued — check command log for result';
      const completed =
        data.instant || data.command?.status === 'SUCCESS' || data.command?.status === 'COMPLETED';
      txnToast.success(completed ? 'Status updated' : 'Command queued', { detail });
      setMessage(detail);
      setError('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const detail = err.response?.data?.message ?? 'Command failed';
      txnToast.failed('Command failed', { detail });
      setError(detail);
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (customerId: string | null) =>
      (await api.patch(`/payc/meters/${id}`, { customerId: customerId || null })).data,
    onSuccess: () => {
      toast.success('Customer updated', { detail: 'Meter assignment saved' });
      setMessage('Customer assignment updated');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error('Assignment failed', {
        detail: err.response?.data?.message ?? 'Could not update customer',
      }),
  });

  const rebindMutation = useMutation({
    mutationFn: async () =>
      (await api.post(`/payc/meters/${id}/rebind-cylinder`, {
        cylinderSerial: cylinderSerial.trim(),
      })).data,
    onSuccess: () => {
      toast.success('Cylinder linked', { detail: 'Meter cylinder binding updated' });
      setMessage('Cylinder linked');
      setCylinderSerial('');
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error('Link failed', {
        detail: err.response?.data?.message ?? 'Could not link cylinder',
      }),
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

      {paymentStatus ? <PaymentStatusBanner status={paymentStatus} /> : null}
      {message && !paymentStatus ? (
        <p className="panel" style={{ color: 'var(--ok)', margin: 0 }}>
          {message}
        </p>
      ) : null}
      {error && !paymentStatus ? (
        <p className="panel" style={{ color: 'var(--danger)', margin: 0 }}>
          {error}
        </p>
      ) : null}

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
          <div className="hint">{formatMoney(Number(meter.deferredRevenue))} prepaid value</div>
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
          <div className="hint">
            {vendor?.flatPriceMwkPerKg != null && vendor.flatPriceMwkPerKg > 0
              ? `Est. ${formatMoney(Number(meter.dailyBurnKg) * vendor.flatPriceMwkPerKg)}/day @ ${formatMoney(vendor.flatPriceMwkPerKg)}/kg`
              : meter.cumulativeFlow
                ? `Total flow ${Number(meter.cumulativeFlow).toFixed(3)}`
                : 'Sync for Zhongyi pricing'}
          </div>
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
            Valve and device commands are sent to Zhongyi. Battery-powered NB-IoT meters
            may take a few minutes to wake up, execute the command, and report back.
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
              onClick={async () => {
                const ok = await confirmAction({
                  title: 'Open gas valve?',
                  detail: `This sends an open command to meter ${meter.meterSerial}. Gas will flow if credit is available and the valve responds.`,
                  confirmLabel: 'Open valve',
                });
                if (ok) valveMutation.mutate(true);
              }}
            >
              Open valve
            </button>
            <button
              type="button"
              className="btn"
              disabled={valveMutation.isPending || !meter.imei}
              onClick={async () => {
                const ok = await confirmAction({
                  title: 'Close gas valve?',
                  detail: `This sends a close command to meter ${meter.meterSerial}. Gas supply will stop when the meter responds.`,
                  confirmLabel: 'Close valve',
                  variant: 'danger',
                });
                if (ok) valveMutation.mutate(false);
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
              Refresh flow &amp; status
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
            disabled={topupMutation.isPending || !!awaitingPayment}
            onClick={async () => {
              const priceHint =
                vendor?.flatPriceMwkPerKg && vendor.flatPriceMwkPerKg > 0
                  ? ` At ${formatMoney(vendor.flatPriceMwkPerKg)}/kg this credits about ${formatKg(topupAmount / vendor.flatPriceMwkPerKg)}.`
                  : '';
              const ok = await confirmAction({
                title: `Top up ${formatMoney(topupAmount)}?`,
                detail:
                  (topupMethod === 'PAYCHANGU'
                    ? `Send a PayChangu mobile money request for ${formatMoney(topupAmount)} and credit meter ${meter.meterSerial} when payment confirms.`
                    : `Record a cash top-up of ${formatMoney(topupAmount)} and send credit to meter ${meter.meterSerial}.`) +
                  priceHint,
                confirmLabel:
                  topupMethod === 'PAYCHANGU' ? 'Start PayChangu top-up' : 'Confirm top-up',
              });
              if (ok) topupMutation.mutate();
            }}
          >
            {topupMutation.isPending
              ? 'Processing…'
              : awaitingPayment
                ? 'Waiting for PayChangu…'
                : `Top up ${formatMoney(topupAmount)}`}
          </button>
        </div>
      </div>

      {vendor && (
        <div className="panel">
          <h3 className="panel-title">Live Zhongyi data</h3>
          <div className="grid two">
            <div>
              <p className="muted" style={{ margin: 0 }}>Zhongyi price</p>
              <strong>
                {vendor.flatPriceMwkPerKg != null
                  ? `${formatMoney(vendor.flatPriceMwkPerKg)}/kg`
                  : '—'}
              </strong>
              {vendor.priceName ? (
                <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                  {vendor.priceName}
                </p>
              ) : null}
            </div>
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
                    <span
                      className={`badge ${
                        c.status === 'FAILED'
                          ? 'warn'
                          : c.status === 'SUCCESS' || c.status === 'COMPLETED'
                            ? 'ok'
                            : ''
                      }`}
                    >
                      {commandStatusLabel(c.status)}
                    </span>
                  </td>
                  <td>{c.requestedBy?.fullName ?? '—'}</td>
                  <td>{commandDisplayMessage(c)}</td>
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
                  <td>{PAYC_TXN_LABELS[c.type] ?? c.type}</td>
                  <td>{formatMoney(Number(c.amountMwk))}</td>
                  <td>{formatKg(Number(c.creditKg))}</td>
                  <td>
                    {c.paymentMethod?.replaceAll('_', ' ') ?? (c.type === 'TOPUP' ? 'Manual' : '—')}
                    {c.reference ? (
                      <span className="muted" style={{ display: 'block', fontSize: '0.78rem' }}>
                        {c.reference}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
