import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type { CapitalProjectPortfolio } from '../lib/erp-types';
import { formatMoney } from '../lib/format';

export function ProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['projects-portfolio'],
    queryFn: async () =>
      (await api.get<CapitalProjectPortfolio>('/projects/portfolio')).data,
  });

  if (isLoading || !data) {
    return <div className="panel">Loading capital projects…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Capital projects"
        subtitle="CAPEX tracking, milestones & grant-funded rollouts (Charter Phase 3)"
      />

      <div className="grid stats">
        <div className="panel stat-card accent">
          <h3>Active projects</h3>
          <div className="value">{data.active}</div>
          <div className="hint">{data.totalProjects} total in portfolio</div>
        </div>
        <div className="panel stat-card">
          <h3>Approved budget</h3>
          <div className="value">{formatMoney(data.totalBudget)}</div>
        </div>
        <div className="panel stat-card">
          <h3>Spent to date</h3>
          <div className="value">{formatMoney(data.totalSpent)}</div>
          <div className="hint">
            {data.totalBudget > 0
              ? `${Math.round((data.totalSpent / data.totalBudget) * 100)}% utilized`
              : '—'}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Project register</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Station</th>
                <th>Status</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Utilization</th>
                <th>Grant ref</th>
              </tr>
            </thead>
            <tbody>
              {data.projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.projectCode}</td>
                  <td>{p.name}</td>
                  <td>{p.type.replaceAll('_', ' ')}</td>
                  <td>{p.station ?? '—'}</td>
                  <td>
                    <span className="badge">{p.status.replaceAll('_', ' ')}</span>
                  </td>
                  <td>{formatMoney(p.approvedBudget)}</td>
                  <td>{formatMoney(p.spentToDate)}</td>
                  <td>{p.utilizationPercent}%</td>
                  <td>{p.grantReference ?? '—'}</td>
                </tr>
              ))}
              {!data.projects.length && (
                <tr>
                  <td colSpan={9} className="muted">
                    No capital projects registered
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
