import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg, formatMoney } from '../lib/format';

export function StaffAnalyticsPage() {
  const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);

  const { data: attendants } = useQuery({
    queryKey: ['staff-attendants', periodStart, periodEnd],
    queryFn: async () =>
      (
        await api.get('/analytics/staff/attendants', {
          params: { periodStart, periodEnd },
        })
      ).data,
  });

  const { data: managers } = useQuery({
    queryKey: ['staff-managers', periodStart, periodEnd],
    queryFn: async () =>
      (
        await api.get('/analytics/staff/managers', {
          params: { periodStart, periodEnd },
        })
      ).data,
  });

  const { data: networkFlash } = useQuery({
    queryKey: ['network-flash'],
    queryFn: async () => (await api.get('/analytics/network-flash')).data,
  });

  return (
    <div className="stack">
      <PageHeader
        title="Staff analytics"
        subtitle={`Performance scorecards · ${periodStart} → ${periodEnd}`}
      />

      <div className="panel">
        <h3 className="panel-title">Today&apos;s network flash</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Station</th>
                <th>Revenue</th>
                <th>kg sold</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {(networkFlash ?? []).map(
                (s: {
                  code: string;
                  revenue: number;
                  kg: number;
                  txnCount: number;
                }) => (
                  <tr key={s.code}>
                    <td>{s.code}</td>
                    <td>{formatMoney(s.revenue)}</td>
                    <td>{formatKg(s.kg)}</td>
                    <td>{s.txnCount}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Attendant scorecards</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Revenue</th>
                  <th>kg</th>
                  <th>Txns</th>
                  <th>Per hour</th>
                </tr>
              </thead>
              <tbody>
                {(attendants ?? []).map(
                  (a: {
                    userId: string;
                    fullName: string;
                    revenue: number;
                    kg: number;
                    txnCount: number;
                    salesPerHour: number;
                  }) => (
                    <tr key={a.userId}>
                      <td>{a.fullName}</td>
                      <td>{formatMoney(a.revenue)}</td>
                      <td>{formatKg(a.kg)}</td>
                      <td>{a.txnCount}</td>
                      <td>{formatMoney(a.salesPerHour)}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Manager scorecards</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Target %</th>
                  <th>Pending shifts</th>
                  <th>Loss cases</th>
                </tr>
              </thead>
              <tbody>
                {(managers ?? []).map(
                  (m: {
                    userId: string;
                    fullName: string;
                    targetAchievementPct: number;
                    pendingShiftApprovals: number;
                    openLossCases: number;
                  }) => (
                    <tr key={m.userId}>
                      <td>{m.fullName}</td>
                      <td>{m.targetAchievementPct}%</td>
                      <td>{m.pendingShiftApprovals}</td>
                      <td>{m.openLossCases}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
