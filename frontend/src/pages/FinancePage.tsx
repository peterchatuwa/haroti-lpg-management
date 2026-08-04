import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';

export function FinancePage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState(
    'date,reference,amount,provider\n2026-08-01,MM123456,15000,AIRTEL_MONEY',
  );
  const [message, setMessage] = useState('');

  const canView =
    user?.role === 'FINANCE_MANAGER' ||
    user?.role === 'DIRECTOR' ||
    user?.role === 'AUDITOR' ||
    user?.role === 'SYSTEM_ADMIN';

  const { data: journals } = useQuery({
    queryKey: ['finance-journals'],
    enabled: canView,
    queryFn: async () => (await api.get('/finance/journals')).data,
  });

  const { data: trialBalance } = useQuery({
    queryKey: ['finance-trial-balance'],
    enabled: canView,
    queryFn: async () => (await api.get('/finance/trial-balance')).data,
  });

  const { data: momoSummary } = useQuery({
    queryKey: ['momo-summary'],
    queryFn: async () => (await api.get('/banking/mobile-money/summary')).data,
  });

  const { data: momoLines } = useQuery({
    queryKey: ['momo-lines'],
    queryFn: async () => (await api.get('/banking/mobile-money/lines')).data,
  });

  const importMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/banking/mobile-money/import', {
          csvText,
        })
      ).data,
    onSuccess: (data) => {
      setMessage(`Imported ${data.imported} mobile-money lines`);
      queryClient.invalidateQueries({ queryKey: ['momo-lines'] });
      queryClient.invalidateQueries({ queryKey: ['momo-summary'] });
    },
  });

  if (!canView) {
    return (
      <div className="stack">
        <PageHeader
          title="Finance"
          subtitle="Journal entries and mobile-money settlement"
        />
        <div className="panel">
          <p>Your role does not have access to the general ledger.</p>
          <h3>Mobile-money settlement</h3>
          <p>
            Matched: {momoSummary?.matched ?? 0} / {momoSummary?.total ?? 0} ·{' '}
            {formatMoney(momoSummary?.totalAmount ?? 0)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        title="Finance & GL"
        subtitle="Journal entries, trial balance, and MoMo settlement import"
      />
      {message && <div className="success">{message}</div>}

      <div className="grid two">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Recent journal entries</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Entry</th>
                  <th>Event</th>
                  <th>Posted</th>
                  <th>Lines</th>
                </tr>
              </thead>
              <tbody>
                {(journals ?? []).slice(0, 15).map(
                  (j: {
                    id: string;
                    entryNumber: string;
                    eventType: string;
                    postedAt: string;
                    lines?: unknown[];
                  }) => (
                    <tr key={j.id}>
                      <td>{j.entryNumber}</td>
                      <td>{j.eventType}</td>
                      <td>{new Date(j.postedAt).toLocaleString()}</td>
                      <td>{j.lines?.length ?? 0}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Trial balance</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {(trialBalance ?? []).map(
                  (a: {
                    code: string;
                    name: string;
                    debit: number;
                    credit: number;
                    balance: number;
                  }) => (
                    <tr key={a.code}>
                      <td>
                        {a.code} · {a.name}
                      </td>
                      <td>{formatMoney(a.debit)}</td>
                      <td>{formatMoney(a.credit)}</td>
                      <td>{formatMoney(a.balance)}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel stack">
        <h3 style={{ marginTop: 0 }}>Mobile-money CSV import</h3>
        <p className="muted">
          Format: date,reference,amount,provider — auto-matches to sale payment
          references.
        </p>
        <textarea
          rows={4}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
        <button
          className="btn btn-primary"
          onClick={() => importMutation.mutate()}
          disabled={importMutation.isPending}
        >
          Import settlement file
        </button>
        <div className="row">
          <span className="badge">
            {momoSummary?.matched ?? 0} matched
          </span>
          <span className="badge warn">
            {momoSummary?.unmatched ?? 0} unmatched
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(momoLines ?? []).slice(0, 20).map(
                (l: {
                  id: string;
                  txnDate: string;
                  reference: string;
                  amount: string;
                  status: string;
                }) => (
                  <tr key={l.id}>
                    <td>{l.txnDate}</td>
                    <td>{l.reference}</td>
                    <td>{formatMoney(l.amount)}</td>
                    <td>
                      <span className="badge">{l.status}</span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
