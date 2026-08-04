export function FlameMark({ size = 48 }: { size?: number }) {
  return (
    <div
      className="flame-mark"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" className="flame-mark-bg" />
        <path
          className="flame-mark-fire"
          d="M32 10c-7 12-14 18-14 28a14 14 0 0028 0c0-10-7-16-14-28z"
        />
        <path
          className="flame-mark-core"
          d="M32 28c-3.5 6-6 9-6 14a6 6 0 0012 0c0-5-2.5-8-6-14z"
        />
      </svg>
    </div>
  );
}
