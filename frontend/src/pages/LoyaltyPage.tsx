import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';

export function LoyaltyPage() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['loyalty-accounts'],
    queryFn: async () => (await api.get('/loyalty/accounts')).data,
  });

  if (isLoading) return <div className="panel">Loading loyalty accounts…</div>;

  return (
    <div className="stack">
      <PageHeader
        title="Loyalty programme"
        subtitle="Customer points balances — 1 point per MWK 1,000 on cash sales"
      />
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Code</th>
                <th>Points</th>
                <th>Lifetime earned</th>
              </tr>
            </thead>
            <tbody>
              {(accounts ?? []).map(
                (a: {
                  id: string;
                  pointsBalance: number;
                  lifetimeEarned: number;
                  customer?: { fullName: string; customerCode: string };
                }) => (
                  <tr key={a.id}>
                    <td>{a.customer?.fullName ?? '—'}</td>
                    <td>{a.customer?.customerCode ?? '—'}</td>
                    <td>{a.pointsBalance}</td>
                    <td>{a.lifetimeEarned}</td>
                  </tr>
                ),
              )}
              {!accounts?.length && (
                <tr>
                  <td colSpan={4} className="muted">
                    No loyalty accounts yet — points accrue on customer cash sales
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
