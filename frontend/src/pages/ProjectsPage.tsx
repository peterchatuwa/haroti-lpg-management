import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import type {
  CapitalProjectDetail,
  CapitalProjectPortfolio,
} from '../lib/erp-types';
import { formatMoney } from '../lib/format';
import { useAuthStore } from '../store/auth';

const PROJECT_TYPES = [
  'CAPEX_STATION',
  'CAPEX_DEPOT',
  'GRANT_FUNDED',
  'PAYC_ROLLOUT',
] as const;

interface MilestoneDraft {
  name: string;
  dueDate: string;
  budgetAllocation: number;
}

function ProjectDetail({
  projectId,
  onClose,
  canManage,
}: {
  projectId: string;
  onClose: () => void;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [expForm, setExpForm] = useState({
    description: '',
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    vendorName: '',
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () =>
      (await api.get<CapitalProjectDetail>(`/projects/${projectId}`)).data,
  });

  const completeMs = useMutation({
    mutationFn: async (milestoneId: string) =>
      (await api.post(`/projects/milestones/${milestoneId}/complete`)).data,
    onSuccess: () => {
      setMsg('Milestone marked complete');
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects-portfolio'] });
    },
    onError: (e: { response?: { data?: { message?: string } } }) => {
      setErr(e.response?.data?.message ?? 'Could not complete milestone');
    },
  });

  const addExp = useMutation({
    mutationFn: async () =>
      (
        await api.post(`/projects/${projectId}/expenditures`, {
          ...expForm,
          isCwip: true,
        })
      ).data,
    onSuccess: () => {
      setMsg('Expenditure posted to CWIP GL');
      setExpForm((f) => ({ ...f, description: '', amount: 0, vendorName: '' }));
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      qc.invalidateQueries({ queryKey: ['projects-portfolio'] });
    },
    onError: (e: { response?: { data?: { message?: string | string[] } } }) => {
      const m = e.response?.data?.message;
      setErr(Array.isArray(m) ? m.join(', ') : m ?? 'Could not post expenditure');
    },
  });

  if (isLoading || !project) {
    return <div className="panel">Loading project…</div>;
  }

  const budget = Number(project.approvedBudget);
  const spent = Number(project.spentToDate);
  const remaining = Math.max(0, budget - spent);

  return (
    <div className="panel stack" style={{ border: '2px solid var(--accent)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <h3 className="panel-title" style={{ marginBottom: '0.25rem' }}>
            {project.name}
          </h3>
          <span className="badge">{project.projectCode}</span>{' '}
          <span className="badge">{project.status.replaceAll('_', ' ')}</span>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>

      {msg && <div className="success">{msg}</div>}
      {err && <div className="error">{err}</div>}

      <div className="grid three">
        <div>
          <strong>Budget</strong>
          <p>{formatMoney(budget)}</p>
        </div>
        <div>
          <strong>Spent</strong>
          <p>{formatMoney(spent)}</p>
        </div>
        <div>
          <strong>Remaining</strong>
          <p>{formatMoney(remaining)}</p>
        </div>
      </div>

      {project.grantReference && (
        <p className="muted">Grant ref: {project.grantReference}</p>
      )}

      <h4>Milestones</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Due</th>
              <th>Budget</th>
              <th>Status</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {project.milestones.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.dueDate ?? '—'}</td>
                <td>{formatMoney(Number(m.budgetAllocation))}</td>
                <td>
                  <span className={`badge ${m.isCompleted ? '' : 'warn'}`}>
                    {m.isCompleted ? 'Done' : 'Pending'}
                  </span>
                </td>
                {canManage && (
                  <td>
                    {!m.isCompleted && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={completeMs.isPending}
                        onClick={() => completeMs.mutate(m.id)}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!project.milestones.length && (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="muted">
                  No milestones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h4>Expenditures</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Vendor</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {project.expenditures.map((e) => (
              <tr key={e.id}>
                <td>{e.expenseDate}</td>
                <td>{e.description}</td>
                <td>{e.vendorName ?? '—'}</td>
                <td>{formatMoney(Number(e.amount))}</td>
              </tr>
            ))}
            {!project.expenditures.length && (
              <tr>
                <td colSpan={4} className="muted">
                  No expenditures recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canManage && (
        <form
          className="stack"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setErr('');
            setMsg('');
            addExp.mutate();
          }}
        >
          <h4 style={{ margin: 0 }}>Log CAPEX expenditure</h4>
          <div className="grid two">
            <label>
              Description
              <input
                value={expForm.description}
                onChange={(e) =>
                  setExpForm((f) => ({ ...f, description: e.target.value }))
                }
                required
              />
            </label>
            <label>
              Vendor
              <input
                value={expForm.vendorName}
                onChange={(e) =>
                  setExpForm((f) => ({ ...f, vendorName: e.target.value }))
                }
              />
            </label>
            <label>
              Amount (MWK)
              <input
                type="number"
                min={1}
                max={remaining}
                value={expForm.amount || ''}
                onChange={(e) =>
                  setExpForm((f) => ({ ...f, amount: Number(e.target.value) }))
                }
                required
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={expForm.expenseDate}
                onChange={(e) =>
                  setExpForm((f) => ({ ...f, expenseDate: e.target.value }))
                }
                required
              />
            </label>
          </div>
          <button
            className="btn btn-accent"
            disabled={addExp.isPending || remaining <= 0}
          >
            {addExp.isPending ? 'Posting…' : 'Post to CWIP (GL 1400)'}
          </button>
        </form>
      )}
    </div>
  );
}

export function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { name: '', dueDate: '', budgetAllocation: 0 },
  ]);
  const [form, setForm] = useState({
    name: '',
    type: 'CAPEX_STATION' as (typeof PROJECT_TYPES)[number],
    stationId: '',
    approvedBudget: 0,
    grantReference: '',
    startDate: '',
    targetEndDate: '',
  });

  const canManage =
    user?.role === 'DIRECTOR' ||
    user?.role === 'FINANCE_MANAGER' ||
    user?.role === 'OPERATIONS_MANAGER' ||
    user?.role === 'SYSTEM_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['projects-portfolio'],
    queryFn: async () =>
      (await api.get<CapitalProjectPortfolio>('/projects/portfolio')).data,
  });

  const { data: stations } = useQuery({
    queryKey: ['stations'],
    queryFn: async () =>
      (await api.get<Array<{ id: string; code: string; name: string }>>('/stations'))
        .data,
    enabled: showCreate,
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        type: form.type,
        approvedBudget: form.approvedBudget,
        stationId: form.stationId || undefined,
        grantReference: form.grantReference || undefined,
        startDate: form.startDate || undefined,
        targetEndDate: form.targetEndDate || undefined,
        milestones: milestones
          .filter((m) => m.name.trim())
          .map((m) => ({
            name: m.name,
            dueDate: m.dueDate || undefined,
            budgetAllocation: m.budgetAllocation,
          })),
      };
      return (await api.post('/projects', payload)).data;
    },
    onSuccess: (created: { id: string; projectCode: string }) => {
      setMsg(`Project ${created.projectCode} created`);
      setShowCreate(false);
      setForm({
        name: '',
        type: 'CAPEX_STATION',
        stationId: '',
        approvedBudget: 0,
        grantReference: '',
        startDate: '',
        targetEndDate: '',
      });
      setMilestones([{ name: '', dueDate: '', budgetAllocation: 0 }]);
      qc.invalidateQueries({ queryKey: ['projects-portfolio'] });
      setSelectedId(created.id);
    },
    onError: (e: { response?: { data?: { message?: string | string[] } } }) => {
      const m = e.response?.data?.message;
      setErr(Array.isArray(m) ? m.join(', ') : m ?? 'Could not create project');
    },
  });

  if (isLoading || !data) {
    return <div className="panel">Loading capital projects…</div>;
  }

  return (
    <div className="stack">
      <PageHeader
        title="Capital projects"
        subtitle="CAPEX tracking, milestones & grant-funded rollouts (Charter Phase 3)"
        action={
          canManage ? (
            <button
              type="button"
              className="btn btn-accent"
              onClick={() => {
                setShowCreate((v) => !v);
                setErr('');
                setMsg('');
              }}
            >
              {showCreate ? 'Cancel' : 'New project'}
            </button>
          ) : undefined
        }
      />

      {msg && <div className="success">{msg}</div>}
      {err && <div className="error">{err}</div>}

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

      {showCreate && canManage && (
        <form
          className="panel stack"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setErr('');
            setMsg('');
            createProject.mutate();
          }}
        >
          <h3 style={{ marginTop: 0 }}>Register capital project</h3>
          <div className="grid two">
            <label>
              Project name
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Type
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as (typeof PROJECT_TYPES)[number],
                  }))
                }
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Station (optional)
              <select
                value={form.stationId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stationId: e.target.value }))
                }
              >
                <option value="">Network / central</option>
                {(stations ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Approved budget (MWK)
              <input
                type="number"
                min={0}
                value={form.approvedBudget || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    approvedBudget: Number(e.target.value),
                  }))
                }
                required
              />
            </label>
            <label>
              Grant reference
              <input
                value={form.grantReference}
                onChange={(e) =>
                  setForm((f) => ({ ...f, grantReference: e.target.value }))
                }
              />
            </label>
            <label>
              Start date
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
              />
            </label>
            <label>
              Target end date
              <input
                type="date"
                value={form.targetEndDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetEndDate: e.target.value }))
                }
              />
            </label>
          </div>

          <div>
            <strong>Milestones</strong>
            {milestones.map((m, i) => (
              <div
                key={i}
                className="grid three"
                style={{ marginTop: '0.5rem', gap: '0.5rem' }}
              >
                <input
                  placeholder="Milestone name"
                  value={m.name}
                  onChange={(e) => {
                    const next = [...milestones];
                    next[i] = { ...next[i], name: e.target.value };
                    setMilestones(next);
                  }}
                />
                <input
                  type="date"
                  value={m.dueDate}
                  onChange={(e) => {
                    const next = [...milestones];
                    next[i] = { ...next[i], dueDate: e.target.value };
                    setMilestones(next);
                  }}
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Budget allocation"
                  value={m.budgetAllocation || ''}
                  onChange={(e) => {
                    const next = [...milestones];
                    next[i] = {
                      ...next[i],
                      budgetAllocation: Number(e.target.value),
                    };
                    setMilestones(next);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginTop: '0.5rem' }}
              onClick={() =>
                setMilestones([
                  ...milestones,
                  { name: '', dueDate: '', budgetAllocation: 0 },
                ])
              }
            >
              + Add milestone
            </button>
          </div>

          <button className="btn btn-accent" disabled={createProject.isPending}>
            {createProject.isPending ? 'Creating…' : 'Create project'}
          </button>
        </form>
      )}

      {selectedId && (
        <ProjectDetail
          projectId={selectedId}
          onClose={() => setSelectedId(null)}
          canManage={canManage}
        />
      )}

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
                <th />
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
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setSelectedId(p.id)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {!data.projects.length && (
                <tr>
                  <td colSpan={10} className="muted">
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
