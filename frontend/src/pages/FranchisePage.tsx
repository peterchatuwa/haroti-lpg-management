import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type {
  AgentCommissionRow,
  FranchiseAgreementRow,
  FranchiseSettlementRow,
} from '../lib/erp-types';
import { formatMoney } from '../lib/format';

export function FranchisePage() {
  const qc = useQueryClient();

  const { data: agreements } = useQuery({
    queryKey: ['franchise-agreements'],
    queryFn: async () =>
      (await api.get<FranchiseAgreementRow[]>('/franchise/agreements')).data,
  });

  const { data: settlements } = useQuery({
    queryKey: ['franchise-settlements'],
    queryFn: async () =>
      (await api.get<FranchiseSettlementRow[]>('/franchise/settlements')).data,
  });

  const { data: commissions } = useQuery({
    queryKey: ['agent-commissions'],
    queryFn: async () =>
      (await api.get<AgentCommissionRow[]>('/franchise/commissions')).data,
  });

  const generate = useMutation({
    mutationFn: (agreementId: string) =>
      api.post('/franchise/settlements/generate', {
        agreementId,
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['franchise-settlements'] }),
  });

  const firstAgreement = agreements?.[0];

  return (
    <div className="stack">
      <PageHeader
        title="Franchise & agents"
        subtitle="Royalty settlements, consignment & field agent commissions (Charter Phase 3)"
      />

      <div className="row">
        {firstAgreement && (
          <button
            className="btn btn-primary"
            disabled={generate.isPending}
            onClick={() => generate.mutate(firstAgreement.id)}
          >
            Generate monthly settlement
          </button>
        )}
        <span className="badge">{agreements?.length ?? 0} active agreements</span>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Franchise agreements</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Franchise</th>
                  <th>Outlet</th>
                  <th>Royalty</th>
                  <th>Agent comm.</th>
                </tr>
              </thead>
              <tbody>
                {(agreements ?? []).map((a) => (
                  <tr key={a.id}>
                    <td>{a.agreementCode}</td>
                    <td>{a.franchiseName}</td>
                    <td>{a.station?.code ?? '—'}</td>
                    <td>{a.royaltyPercent}%</td>
                    <td>{a.agentCommissionPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Recent settlements</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Settlement #</th>
                  <th>Period</th>
                  <th>Sales</th>
                  <th>Royalty due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(settlements ?? []).map((s) => (
                  <tr key={s.id}>
                    <td>{s.settlementNumber}</td>
                    <td>
                      {s.periodStart} → {s.periodEnd}
                    </td>
                    <td>{formatMoney(Number(s.totalSales))}</td>
                    <td>{formatMoney(Number(s.royaltyDue))}</td>
                    <td>
                      <span
                        className={`badge ${
                          s.status === 'INVOICED' ? 'ok' : 'warn'
                        }`}
                      >
                        {s.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!settlements?.length && (
                  <tr>
                    <td colSpan={5} className="muted">
                      No settlements yet — generate one for the current period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Agent commissions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Sale amount</th>
                <th>Rate</th>
                <th>Commission</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(commissions ?? []).map((c) => (
                <tr key={c.id}>
                  <td>{c.agent?.fullName ?? c.agentId}</td>
                  <td>{formatMoney(Number(c.saleAmount))}</td>
                  <td>{c.commissionPercent}%</td>
                  <td>{formatMoney(Number(c.commissionAmount))}</td>
                  <td>
                    <span className="badge">{c.status.replaceAll('_', ' ')}</span>
                  </td>
                </tr>
              ))}
              {!commissions?.length && (
                <tr>
                  <td colSpan={5} className="muted">
                    Commissions accrue on AGENT_COMMISSION channel sales
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
