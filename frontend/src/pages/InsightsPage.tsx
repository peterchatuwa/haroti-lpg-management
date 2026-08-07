import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';
import { formatKg } from '../lib/format';

export function InsightsPage() {
  const [question, setQuestion] = useState('Which station has the highest stockout risk?');
  const [answer, setAnswer] = useState<Record<string, unknown> | null>(null);

  const { data: forecast } = useQuery({
    queryKey: ['ai-forecast'],
    queryFn: async () => (await api.get('/ai/forecasts/demand', { params: { days: 7 } })).data,
  });

  const { data: stockout } = useQuery({
    queryKey: ['ai-stockout'],
    queryFn: async () => (await api.get('/ai/stockout-risk')).data,
  });

  const { data: anomalies } = useQuery({
    queryKey: ['ai-anomalies'],
    queryFn: async () => (await api.get('/ai/anomalies')).data,
  });

  const askMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/ai/analytics/query', { question })).data,
    onSuccess: (data) => setAnswer(data),
  });

  const forecastSample = (forecast ?? []).slice(0, 10);

  return (
    <div className="stack">
      <PageHeader
        title="AI insights"
        subtitle="Demand forecasts, stockout risk, anomalies and read-only analytics assistant"
      />

      <div className="panel stack">
        <h3 className="panel-title">Ask analytics (read-only)</h3>
        <label>
          Question
          <input value={question} onChange={(e) => setQuestion(e.target.value)} />
        </label>
        <button
          type="button"
          className="btn btn-accent"
          disabled={askMutation.isPending}
          onClick={() => askMutation.mutate()}
        >
          Ask
        </button>
        {answer && (
          <div className="panel muted">
            <p>{String(answer.answer)}</p>
          </div>
        )}
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Stockout risk ranking</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Station</th><th>Risk</th><th>Cover (days)</th></tr>
              </thead>
              <tbody>
                {(stockout ?? []).slice(0, 8).map(
                  (r: { stationId: string; stationCode: string; riskScore: number; coverDays: number }) => (
                    <tr key={r.stationId}>
                      <td>{r.stationCode}</td>
                      <td><span className="badge warn">{r.riskScore}</span></td>
                      <td>{r.coverDays}d</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Anomaly flags (7 days)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Type</th><th>Detail</th><th>Severity</th></tr>
              </thead>
              <tbody>
                {(anomalies ?? []).slice(0, 8).map(
                  (a: { id: string; category: string; title: string; severity: string }) => (
                    <tr key={a.id}>
                      <td>{a.category.replaceAll('_', ' ')}</td>
                      <td>{a.title}</td>
                      <td>{a.severity}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">7-day demand forecast (sample)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Station</th><th>Date</th><th>Predicted kg</th><th>Range</th><th>Confidence</th></tr>
            </thead>
            <tbody>
              {forecastSample.map(
                (f: {
                  stationCode: string;
                  forecastDate: string;
                  predictedKg: number;
                  lowerKg: number;
                  upperKg: number;
                  confidencePct: number;
                }) => (
                  <tr key={`${f.stationCode}-${f.forecastDate}`}>
                    <td>{f.stationCode}</td>
                    <td>{f.forecastDate}</td>
                    <td>{formatKg(f.predictedKg)}</td>
                    <td>{formatKg(f.lowerKg)} – {formatKg(f.upperKg)}</td>
                    <td>{f.confidencePct}%</td>
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
