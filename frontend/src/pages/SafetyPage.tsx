import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import api from '../lib/api';

export function SafetyPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState('NEAR_MISS');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');

  const { data: incidents } = useQuery({
    queryKey: ['safety-incidents'],
    queryFn: async () => (await api.get('/safety/incidents')).data,
  });

  const { data: compliance } = useQuery({
    queryKey: ['compliance-items'],
    queryFn: async () => (await api.get('/safety/compliance')).data,
  });

  const reportMutation = useMutation({
    mutationFn: async () =>
      (
        await api.post('/safety/incidents', {
          type,
          severity,
          description,
        })
      ).data,
    onSuccess: () => {
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
    },
  });

  return (
    <div className="stack">
      <PageHeader
        title="Safety & compliance"
        subtitle="Incident register and compliance calendar"
      />

      <div className="panel">
        <h3 className="panel-title">Report incident</h3>
        <div className="form-grid">
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="GAS_LEAK">Gas leak</option>
              <option value="FIRE">Fire</option>
              <option value="INJURY">Injury</option>
              <option value="NEAR_MISS">Near miss</option>
              <option value="EQUIPMENT_FAILURE">Equipment failure</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label>
            Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </label>
          <label>
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-accent"
            disabled={!description || reportMutation.isPending}
            onClick={() => reportMutation.mutate()}
          >
            Submit report
          </button>
        </div>
      </div>

      <div className="grid two">
        <div className="panel">
          <h3 className="panel-title">Incidents</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(incidents ?? []).map(
                  (i: {
                    id: string;
                    incidentNumber: string;
                    type: string;
                    severity: string;
                    status: string;
                  }) => (
                    <tr key={i.id}>
                      <td>{i.incidentNumber}</td>
                      <td>{i.type.replaceAll('_', ' ')}</td>
                      <td>{i.severity}</td>
                      <td>{i.status}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">Compliance calendar</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Station</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(compliance ?? []).map(
                  (c: {
                    id: string;
                    title: string;
                    station?: { code: string };
                    expiryDate: string;
                    status: string;
                  }) => (
                    <tr key={c.id}>
                      <td>{c.title}</td>
                      <td>{c.station?.code ?? 'Network'}</td>
                      <td>{c.expiryDate}</td>
                      <td>
                        <span className={`badge ${c.status === 'VALID' ? '' : 'warn'}`}>
                          {c.status.replaceAll('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ),
                )}
                {!compliance?.length && (
                  <tr>
                    <td colSpan={4} className="muted">
                      No compliance items — add via API
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
