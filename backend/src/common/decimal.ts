export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  return Number(value);
}

export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function asDecimal(value: number, scale = 3): string {
  return value.toFixed(scale);
}
