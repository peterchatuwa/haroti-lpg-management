export function TankGauge({
  fillPercent,
  label,
  sublabel,
  size = 120,
}: {
  fillPercent: number;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const pct = Math.max(0, Math.min(100, fillPercent));
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="tank-gauge" style={{ width: size }}>
      <svg viewBox="0 0 120 120" className="tank-gauge-svg">
        <circle cx="60" cy="60" r={r} className="tank-gauge-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="tank-gauge-fill"
          style={{
            strokeDasharray: `${c}`,
            strokeDashoffset: offset,
          }}
        />
        <text x="60" y="56" textAnchor="middle" className="tank-gauge-pct">
          {Math.round(pct)}%
        </text>
        <text x="60" y="74" textAnchor="middle" className="tank-gauge-cap">
          filled
        </text>
      </svg>
      <div className="tank-gauge-meta">
        <strong>{label}</strong>
        {sublabel && <span>{sublabel}</span>}
      </div>
    </div>
  );
}
