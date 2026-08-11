import axios from 'axios';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { PortalBrandLayout } from '../components/PortalBrandLayout';
import { formatKg, formatMoney } from '../lib/format';

const portalApi = axios.create({ baseURL: '/api/customer-portal' });

function setPortalToken(token: string | null) {
  if (token) {
    portalApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    sessionStorage.setItem('customerToken', token);
  } else {
    delete portalApi.defaults.headers.common.Authorization;
    sessionStorage.removeItem('customerToken');
  }
}

const saved = sessionStorage.getItem('customerToken');
if (saved) setPortalToken(saved);

export function CustomerPortalPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'app'>(saved ? 'app' : 'phone');
  const [devCode, setDevCode] = useState<string>();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [prices, setPrices] = useState<Record<string, unknown> | null>(null);
  const [stations, setStations] = useState<Array<Record<string, unknown>>>([]);
  const [receipts, setReceipts] = useState<Array<Record<string, unknown>>>([]);
  const [loyalty, setLoyalty] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('');
  const [qty, setQty] = useState(12);
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);

  async function loadApp() {
    const [me, p, st, r, l, req] = await Promise.all([
      portalApi.get('/me'),
      portalApi.get('/prices'),
      portalApi.get('/stations'),
      portalApi.get('/receipts'),
      portalApi.get('/loyalty'),
      portalApi.get('/refill-requests'),
    ]);
    setProfile(me.data);
    setPrices(p.data);
    setStations(st.data);
    setReceipts(r.data);
    setLoyalty(l.data);
    setRequests(req.data);
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    const res = await portalApi.post('/auth/request-otp', { phone });
    setDevCode(res.data.devCode);
    setMessage('OTP sent to your phone');
    setStep('otp');
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const res = await portalApi.post('/auth/verify-otp', { phone, code });
    setPortalToken(res.data.accessToken);
    setStep('app');
    await loadApp();
  }

  async function submitRefill(e: React.FormEvent) {
    e.preventDefault();
    await portalApi.post('/refill-requests', {
      quantityKg: qty,
      stationId: stations[0]?.id,
    });
    setMessage('Refill request submitted');
    await loadApp();
  }

  function signOut() {
    setPortalToken(null);
    setStep('phone');
    setProfile(null);
  }

  if (step === 'phone') {
    return (
      <PortalBrandLayout>
        <PageHeader title="Customer portal" subtitle="Sign in with your registered mobile number" />
        <form className="panel stack" onSubmit={requestOtp}>
          <label>
            Mobile number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+265..." required />
          </label>
          <button type="submit" className="btn btn-primary">Send login code</button>
        </form>
      </PortalBrandLayout>
    );
  }

  if (step === 'otp') {
    return (
      <PortalBrandLayout>
        <PageHeader title="Enter OTP" subtitle="Check SMS for your 6-digit code" />
        {devCode && <div className="panel muted">Dev code: {devCode}</div>}
        <form className="panel stack" onSubmit={verifyOtp}>
          <label>
            OTP code
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
          <button type="submit" className="btn btn-primary">Sign in</button>
        </form>
      </PortalBrandLayout>
    );
  }

  return (
    <PortalBrandLayout>
    <div className="stack">
      <PageHeader
        title="My Haroti account"
        subtitle={String((profile as { fullName?: string })?.fullName ?? '')}
      />
      {message && <div className="success">{message}</div>}

      <div className="grid stats">
        <div className="panel stat-card">
          <h3>Balance</h3>
          <div className="value">
            {formatMoney((profile as { outstandingBalance?: string })?.outstandingBalance)}
          </div>
        </div>
        <div className="panel stat-card">
          <h3>Loyalty points</h3>
          <div className="value">{(loyalty as { pointsBalance?: number })?.pointsBalance ?? 0}</div>
        </div>
        <div className="panel stat-card">
          <h3>LPG price / kg</h3>
          <div className="value">
            {formatMoney((prices as { networkPricePerKg?: string })?.networkPricePerKg)}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Recent receipts</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Receipt</th><th>Amount</th><th>kg</th></tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={String(r.id)}>
                    <td>{String(r.receiptNumber)}</td>
                    <td>{formatMoney(String(r.totalAmount))}</td>
                    <td>{formatKg(String(r.lpgQuantityKg))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form className="panel stack" onSubmit={submitRefill}>
          <h3 className="panel-title">Request refill</h3>
          <label>
            Quantity (kg)
            <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} />
          </label>
          <button type="submit" className="btn btn-accent">Submit request</button>
          {requests.length > 0 && (
            <p className="muted">Latest: {String(requests[0].requestNumber)} — {String(requests[0].status)}</p>
          )}
        </form>
      </div>

      <div className="panel">
        <h3 className="panel-title">Nearest stations</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Code</th><th>Name</th><th>District</th><th>Stock</th></tr>
            </thead>
            <tbody>
              {stations.slice(0, 8).map((s) => (
                <tr key={String(s.id)}>
                  <td>{String(s.code)}</td>
                  <td>{String(s.name)}</td>
                  <td>{String(s.district ?? '—')}</td>
                  <td>{formatKg(String(s.currentStockKg ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="button" className="btn btn-ghost" onClick={signOut}>Sign out</button>
    </div>
    </PortalBrandLayout>
  );
}
