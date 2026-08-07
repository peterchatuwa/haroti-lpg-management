import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatMoney } from '../lib/format';

export function TargetsPage() {
  const queryClient = useQueryClient();
  const [metric, setMetric] = useState('REVENUE');
  const [targetValue, setTargetValue] = useState('5000000');
  const [stationId, setStationId] = useState('');

  const { data: progress } = useQuery({
    queryKey: ['targets-progress'],
    queryFn: async () => (await api.get('/targets/progress')).data,
  });

  const { data: stations } = useQuery({
    queryKey: ['stations-list'],
    queryFn: async () => (await api.get('/stations')).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      return (
        await api.post('/targets', {
          scope: stationId ? 'STATION' : 'NETWORK',
          stationId: stationId || undefined,
          metric,
          periodType: 'MONTH',
          year: now.getFullYear(),
          period: now.getMonth() + 1,
          targetValue: Number(targetValue),
        })
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets-progress'] });
      queryClient.invalidateQueries({ queryKey: ['executive-overview'] });
    },
  });

  return (
    <div className="stack">
      <PageHeader
        title="Targets"
        subtitle="Monthly revenue, kg and margin targets vs actual"
      />

      <div className="panel">
        <h3 className="panel-title">Set target (current month)</h3>
        <div className="form-grid">
          <label>
            Metric
            <select value={metric} onChange={(e) => setMetric(e.target.value)}>
              <option value="REVENUE">Revenue (MWK)</option>
              <option value="KG">LPG kg</option>
              <option value="MARGIN">Gross margin (MWK)</option>
            </select>
          </label>
          <label>
            Station (blank = network)
            <select value={stationId} onChange={(e) => setStationId(e.target.value)}>
              <option value="">Network-wide</option>
              {(stations ?? []).map((s: { id: string; code: string }) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target value
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            Save target
          </button>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Progress this month</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Scope</th>
                <th>Metric</th>
                <th>Target</th>
                <th>Actual</th>
                <th>Variance</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {(progress ?? []).map(
                (t: {
                  id: string;
                  stationCode?: string;
                  metric: string;
                  target: number;
                  actual: number;
                  variance: number;
                  achievementPct: number;
                }) => (
                  <tr key={t.id}>
                    <td>{t.stationCode ?? 'Network'}</td>
                    <td>{t.metric}</td>
                    <td>{formatMoney(t.target)}</td>
                    <td>{formatMoney(t.actual)}</td>
                    <td>{formatMoney(t.variance)}</td>
                    <td>
                      <span
                        className={`badge ${t.achievementPct >= 100 ? '' : 'warn'}`}
                      >
                        {t.achievementPct}%
                      </span>
                    </td>
                  </tr>
                ),
              )}
              {!progress?.length && (
                <tr>
                  <td colSpan={6} className="muted">
                    No targets set for this month
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
