import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';

interface StatementLine {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  stationCode?: string;
}

interface Statement {
  customer: {
    id: string;
    customerCode: string;
    fullName: string;
    phone?: string;
    type: string;
    creditLimit: number;
    outstandingBalance: number;
    isSuspended: boolean;
    station?: { code: string; name: string };
  };
  lines: StatementLine[];
  closingBalance: number;
}

export function CustomerStatementPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['customer-statement', id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<Statement>(`/customers/${id}/statement`)).data,
  });

  if (isLoading || !data) {
    return (
      <div className="stack">
        <PageHeader title="Customer statement" subtitle="Loading…" />
        <div className="panel">Loading account history…</div>
      </div>
    );
  }

  const c = data.customer;

  return (
    <div className="stack">
      <PageHeader
        title={`${c.fullName} — statement`}
        subtitle={`${c.customerCode} · ${c.type.replaceAll('_', ' ')}`}
        action={
          <Link className="btn btn-ghost" to="/">
            ← Dashboard
          </Link>
        }
      />

      <div className="grid stats">
        <div className="panel stat-card">
          <h3>Credit limit</h3>
          <div className="value">{formatMoney(c.creditLimit)}</div>
        </div>
        <div className="panel stat-card deep">
          <h3>Outstanding balance</h3>
          <div className="value">{formatMoney(c.outstandingBalance)}</div>
        </div>
        <div className="panel stat-card">
          <h3>Home station</h3>
          <div className="value" style={{ fontSize: '1.35rem' }}>
            {c.station?.code ?? 'Network'}
          </div>
        </div>
        <div className="panel stat-card">
          <h3>Status</h3>
          <div className="value" style={{ fontSize: '1.1rem' }}>
            {c.isSuspended ? (
              <span className="badge warn">Suspended</span>
            ) : (
              <span className="badge ok">Active</span>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Account activity</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line, i) => (
                <tr key={`${line.reference}-${i}`}>
                  <td>{line.date}</td>
                  <td>{line.reference}</td>
                  <td>{line.description}</td>
                  <td>{line.debit > 0 ? formatMoney(line.debit) : '—'}</td>
                  <td>{line.credit > 0 ? formatMoney(line.credit) : '—'}</td>
                  <td>{formatMoney(line.balance)}</td>
                </tr>
              ))}
              {!data.lines.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    No credit sales recorded for this customer yet.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>
                  <strong>Closing balance</strong>
                </td>
                <td>
                  <strong>{formatMoney(data.closingBalance)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
