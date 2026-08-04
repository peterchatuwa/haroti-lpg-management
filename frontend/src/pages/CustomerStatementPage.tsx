import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';

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
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  const canRecordPayment =
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'FINANCE_MANAGER' ||
    user?.role === 'OPERATIONS_MANAGER';

  const { data, isLoading } = useQuery({
    queryKey: ['customer-statement', id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<Statement>(`/customers/${id}/statement`)).data,
  });

  const recordPayment = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/customers/${id}/payments`, {
          amount: Number(amount),
          paymentMethod: 'CASH',
          reference: reference || undefined,
          clientTxnId: crypto.randomUUID(),
        })
      ).data,
    onSuccess: () => {
      setAmount('');
      setReference('');
      qc.invalidateQueries({ queryKey: ['customer-statement', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    recordPayment.mutate();
  }

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

      {canRecordPayment && c.outstandingBalance > 0 && (
        <div className="panel">
          <h3 className="panel-title">Record payment</h3>
          <form className="row" onSubmit={onSubmit}>
            <label>
              Amount (MWK)
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <label>
              Reference
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt / MoMo ref"
              />
            </label>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={recordPayment.isPending}
            >
              {recordPayment.isPending ? 'Posting…' : 'Post payment'}
            </button>
          </form>
          {recordPayment.isError && (
            <p className="muted" style={{ marginTop: '0.75rem' }}>
              Could not record payment. Check amount and try again.
            </p>
          )}
        </div>
      )}

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
                    No credit sales or payments recorded for this customer yet.
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
