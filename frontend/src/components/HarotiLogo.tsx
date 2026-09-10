export function HarotiLogo({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/brand/haroti-gas-logo.png"
      alt="Haroti Gas"
      className={`haroti-logo ${className}`.trim()}
      style={{ height: size, width: 'auto' }}
    />
  );
}
