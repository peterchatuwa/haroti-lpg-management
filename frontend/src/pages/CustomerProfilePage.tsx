import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';

interface CustomerProfile {
  customer: {
    id: string;
    customerCode: string;
    fullName: string;
    phone?: string;
    type: string;
    creditLimit: number;
    outstandingBalance: number;
    isSuspended: boolean;
    contractPricePerKg?: number | null;
    station?: { code: string; name: string };
    createdAt: string;
  };
  summary: {
    saleCount: number;
    lifetimeRevenue: number;
    lifetimeKg: number;
    lifetimePayments: number;
    cylinderCount: number;
    paycMeterCount: number;
    loyaltyPoints: number;
    loyaltyLifetimeEarned: number;
  };
  recentSales: Array<{
    id: string;
    receiptNumber: string;
    soldAt: string;
    stationCode?: string;
    totalAmount: number;
    lpgQuantityKg: number;
    paymentMethod: string;
  }>;
  recentPayments: Array<{
    id: string;
    paidAt: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
  }>;
  cylinders: Array<{
    id: string;
    serialNumber: string;
    sizeKg: number;
    status: string;
    stationCode?: string;
    nextInspectionDate?: string;
  }>;
  paycMeters: Array<{
    id: string;
    meterSerial: string;
    status: string;
    creditBalanceKg: number;
    stationCode?: string;
    lastTelemetryAt?: string;
  }>;
  loyalty: {
    pointsBalance: number;
    lifetimeEarned: number;
    recentTransactions: Array<{
      id: string;
      type: string;
      points: number;
      balanceAfter: number;
      description: string;
      createdAt: string;
    }>;
  };
  refillRequests: Array<{
    id: string;
    requestNumber: string;
    status: string;
    quantityKg: number;
    preferredDate?: string;
    stationCode?: string;
    createdAt: string;
  }>;
  communications: Array<{
    id: string;
    channel: string;
    status: string;
    title?: string;
    body?: string;
    sentAt: string;
  }>;
}

export function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['customer-profile', id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<CustomerProfile>(`/customers/${id}/profile`)).data,
  });

  if (isLoading || !data) {
    return (
      <div className="stack">
        <PageHeader title="Customer profile" subtitle="Loading…" />
      </div>
    );
  }

  const { customer, summary } = data;

  return (
    <div className="stack">
      <PageHeader
        title={customer.fullName}
        subtitle={`${customer.customerCode} · ${customer.type.replaceAll('_', ' ')}`}
        action={
          <Link className="btn btn-secondary" to={`/customers/${id}/statement`}>
            View statement
          </Link>
        }
      />

      {customer.isSuspended && (
        <div className="panel error-panel">Account suspended — credit sales blocked.</div>
      )}

      <div className="grid stats">
        <div className="panel stat-card deep">
          <h3>Outstanding AR</h3>
          <div className="value">{formatMoney(customer.outstandingBalance)}</div>
          <p className="hint">Limit {formatMoney(customer.creditLimit)}</p>
        </div>
        <div className="panel stat-card">
          <h3>Lifetime revenue</h3>
          <div className="value">{formatMoney(summary.lifetimeRevenue)}</div>
          <p className="hint">{summary.saleCount} sales · {summary.lifetimeKg} kg</p>
        </div>
        <div className="panel stat-card">
          <h3>Payments received</h3>
          <div className="value">{formatMoney(summary.lifetimePayments)}</div>
        </div>
        <div className="panel stat-card accent">
          <h3>Loyalty points</h3>
          <div className="value">{summary.loyaltyPoints.toLocaleString()}</div>
          <p className="hint">{summary.loyaltyLifetimeEarned} lifetime earned</p>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Account details</h3>
          <p><strong>Phone:</strong> {customer.phone ?? '—'}</p>
          <p><strong>Home station:</strong> {customer.station?.name ?? 'Network'}</p>
          <p>
            <strong>Contract price:</strong>{' '}
            {customer.contractPricePerKg
              ? `${formatMoney(customer.contractPricePerKg)}/kg`
              : 'Standard list'}
          </p>
          <p>
            <strong>Customer since:</strong>{' '}
            {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="panel">
          <h3 className="panel-title">Assets & services</h3>
          <p><strong>Cylinders on account:</strong> {summary.cylinderCount}</p>
          <p><strong>PAYC meters:</strong> {summary.paycMeterCount}</p>
          <p><strong>Portal refill requests:</strong> {data.refillRequests.length}</p>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Recent purchases</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Receipt</th>
                  <th>Station</th>
                  <th>Kg</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.length === 0 ? (
                  <tr><td colSpan={5} className="muted">No sales yet</td></tr>
                ) : (
                  data.recentSales.map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.soldAt).toLocaleDateString()}</td>
                      <td>{s.receiptNumber}</td>
                      <td>{s.stationCode ?? '—'}</td>
                      <td>{s.lpgQuantityKg}</td>
                      <td>{formatMoney(s.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Recent payments</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPayments.length === 0 ? (
                  <tr><td colSpan={4} className="muted">No payments recorded</td></tr>
                ) : (
                  data.recentPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.paidAt).toLocaleDateString()}</td>
                      <td>{p.reference ?? '—'}</td>
                      <td>{p.paymentMethod.replaceAll('_', ' ')}</td>
                      <td>{formatMoney(p.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Cylinders</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Next inspection</th>
                </tr>
              </thead>
              <tbody>
                {data.cylinders.length === 0 ? (
                  <tr><td colSpan={4} className="muted">No cylinders assigned</td></tr>
                ) : (
                  data.cylinders.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/cylinders?serial=${c.serialNumber}`}>{c.serialNumber}</Link>
                      </td>
                      <td>{c.sizeKg} kg</td>
                      <td>{c.status}</td>
                      <td>{c.nextInspectionDate ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">PAYC meters</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Credit (kg)</th>
                  <th>Status</th>
                  <th>Last telemetry</th>
                </tr>
              </thead>
              <tbody>
                {data.paycMeters.length === 0 ? (
                  <tr><td colSpan={4} className="muted">No PAYC meters</td></tr>
                ) : (
                  data.paycMeters.map((m) => (
                    <tr key={m.id}>
                      <td>{m.meterSerial}</td>
                      <td>{m.creditBalanceKg}</td>
                      <td>{m.status}</td>
                      <td>
                        {m.lastTelemetryAt
                          ? new Date(m.lastTelemetryAt).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Loyalty activity</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {data.loyalty.recentTransactions.length === 0 ? (
                  <tr><td colSpan={4} className="muted">No loyalty transactions</td></tr>
                ) : (
                  data.loyalty.recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>{t.type}</td>
                      <td>{t.type === 'REDEEM' ? `−${t.points}` : `+${t.points}`}</td>
                      <td>{t.balanceAfter}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Communication history</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {data.communications.length === 0 ? (
                  <tr><td colSpan={4} className="muted">No outbound messages logged</td></tr>
                ) : (
                  data.communications.map((c) => (
                    <tr key={c.id}>
                      <td>{new Date(c.sentAt).toLocaleDateString()}</td>
                      <td>{c.channel}</td>
                      <td>{c.status}</td>
                      <td>{c.title ?? c.body?.slice(0, 60) ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {data.refillRequests.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Refill requests</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Status</th>
                  <th>Kg</th>
                  <th>Station</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.refillRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.requestNumber}</td>
                    <td>{r.status}</td>
                    <td>{r.quantityKg}</td>
                    <td>{r.stationCode ?? 'Any'}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
