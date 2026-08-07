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
  const [passportSerial, setPassportSerial] = useState('');
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

  const passportCylinder = (cylinders ?? []).find(
    (c: { serialNumber: string }) =>
      c.serialNumber.toLowerCase() === passportSerial.trim().toLowerCase(),
  );

  const { data: passport } = useQuery({
    queryKey: ['cylinder-passport', passportCylinder?.id],
    enabled: !!passportCylinder?.id,
    queryFn: async () =>
      (await api.get(`/cylinders/${passportCylinder!.id}/passport`)).data,
  });

  const { data: stocktakes } = useQuery({
    queryKey: ['cylinder-stocktakes', stationId],
    enabled: !!stationId,
    queryFn: async () =>
      (await api.get('/cylinders/stocktakes', { params: { stationId } })).data,
  });

  const createStocktakeMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/cylinders/stocktakes', { stationId })).data,
    onSuccess: () => {
      setMessage('Stocktake session opened');
      queryClient.invalidateQueries({ queryKey: ['cylinder-stocktakes'] });
    },
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
        subtitle="Track company cylinders, passport lookup and stocktakes"
      />
      {message && <div className="success">{message}</div>}

      <div className="grid two">
        <div className="panel stack">
          <h3 style={{ marginTop: 0 }}>Cylinder passport (QR)</h3>
          <label>
            Serial number
            <input
              value={passportSerial}
              onChange={(e) => setPassportSerial(e.target.value)}
              placeholder="HH-LLW-01-0001"
            />
          </label>
          {passport && (
            <div className="stack">
              <p>
                <strong>{passport.serialNumber}</strong> · {passport.sizeKg} kg ·{' '}
                {passport.status}
              </p>
              <p className="muted">Next inspection: {passport.nextInspectionDate ?? '—'}</p>
              <code style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {passport.qrPayload}
              </code>
            </div>
          )}
          {passportSerial && !passportCylinder && (
            <p className="muted">Serial not found at this station</p>
          )}
        </div>

        <div className="panel stack">
          <h3 style={{ marginTop: 0 }}>Cylinder stocktake</h3>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!stationId || createStocktakeMutation.isPending}
            onClick={() => createStocktakeMutation.mutate()}
          >
            Open new stocktake
          </button>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Scanned</th>
                </tr>
              </thead>
              <tbody>
                {(stocktakes ?? []).slice(0, 5).map(
                  (s: {
                    id: string;
                    createdAt: string;
                    status: string;
                    scannedCount?: number;
                  }) => (
                    <tr key={s.id}>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td>{s.status}</td>
                      <td>{s.scannedCount ?? 0}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
