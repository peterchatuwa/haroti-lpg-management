export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatKg(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })} kg`;
}
