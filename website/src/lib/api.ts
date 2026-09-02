const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api';

export interface CatalogItem {
  sku: string;
  name: string;
  category: 'cylinder' | 'accessory' | 'bundle';
  unitPrice: number;
  nominalKg: number | null;
  quantityAvailable: number;
  inStock: boolean;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };
  if (!res.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : typeof data.message === 'string'
        ? data.message
        : 'Request failed';
    throw new Error(message);
  }
  return data;
}

export function fetchCatalog(): Promise<CatalogItem[]> {
  return fetch(`${API_BASE}/public/catalog`).then((res) => parseJson(res));
}

export function submitContactForm(payload: Record<string, string>) {
  return fetch(`${API_BASE}/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((res) => parseJson<{ ok: boolean }>(res));
}

export function submitFranchiseForm(payload: Record<string, string>) {
  return fetch(`${API_BASE}/public/franchise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((res) => parseJson<{ ok: boolean }>(res));
}

export function submitCareersForm(payload: Record<string, string>) {
  return fetch(`${API_BASE}/public/careers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((res) => parseJson<{ ok: boolean }>(res));
}

export function formDataToObject(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const result: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}
