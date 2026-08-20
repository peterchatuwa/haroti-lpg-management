import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BatteryWarning, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export interface PaycSafetyIncident {
  meterId: string;
  meterSerial: string;
  imei?: string;
  types: string[];
  severity: 'critical' | 'warning';
  summary: string;
  location?: string;
  customerName?: string;
  stationName?: string;
  safetyCheckedAt?: string;
}

export interface PaycSafetyAlertsResponse {
  count: number;
  criticalCount: number;
  warningCount: number;
  incidents: PaycSafetyIncident[];
}

export function SafetyAlertBanner() {
  const { data } = useQuery({
    queryKey: ['payc-safety-alerts'],
    queryFn: async () =>
      (await api.get<PaycSafetyAlertsResponse>('/payc/safety-alerts')).data,
    refetchInterval: 20000,
    retry: false,
  });

  if (!data?.count) return null;

  const critical = data.criticalCount > 0;

  return (
    <div
      className={`safety-alert-banner ${critical ? 'critical' : 'warning'}`}
      role="alert"
    >
      <div className="safety-alert-banner-inner">
        <div className="safety-alert-banner-title">
          {critical ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
          <strong>
            {critical
              ? `${data.criticalCount} critical PAYC safety incident${data.criticalCount > 1 ? 's' : ''}`
              : `${data.warningCount} PAYC meter warning${data.warningCount > 1 ? 's' : ''}`}
          </strong>
        </div>
        <ul className="safety-alert-list">
          {data.incidents.slice(0, 4).map((incident) => (
            <li key={incident.meterId}>
              <Link to={`/payc/${incident.meterId}`}>
                <span className="safety-alert-meter">{incident.meterSerial}</span>
                {incident.types.map((type) => (
                  <span
                    key={type}
                    className={`badge ${type === 'LEAK' || type === 'TAMPER' ? 'danger' : 'warn'}`}
                  >
                    {type === 'LEAK' && 'Leak'}
                    {type === 'TAMPER' && 'Tamper'}
                    {type === 'LOW_BATTERY' && 'Low battery'}
                  </span>
                ))}
                <span className="safety-alert-summary">{incident.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="safety-alert-actions">
          <Link to="/payc" className="btn btn-sm">
            Open PAYC fleet
          </Link>
          <Link to="/safety" className="btn btn-sm">
            Safety incidents
          </Link>
          <Link to="/notifications" className="btn btn-sm btn-ghost">
            Notifications
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SafetyAlertBadges() {
  const { data } = useQuery({
    queryKey: ['payc-safety-alerts'],
    queryFn: async () =>
      (await api.get<PaycSafetyAlertsResponse>('/payc/safety-alerts')).data,
    refetchInterval: 20000,
    retry: false,
  });

  if (!data?.count) return null;

  const leakCount = data.incidents.filter((i) => i.types.includes('LEAK')).length;
  const tamperCount = data.incidents.filter((i) => i.types.includes('TAMPER')).length;
  const batteryCount = data.incidents.filter((i) =>
    i.types.includes('LOW_BATTERY'),
  ).length;

  return (
    <>
      {(leakCount > 0 || tamperCount > 0) && (
        <Link to="/payc" className="badge danger safety-badge-pulse">
          <ShieldAlert size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
          {leakCount + tamperCount} safety
        </Link>
      )}
      {batteryCount > 0 && (
        <Link to="/payc" className="badge warn">
          <BatteryWarning size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
          {batteryCount} low batt.
        </Link>
      )}
    </>
  );
}
