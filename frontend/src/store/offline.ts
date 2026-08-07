import { create } from 'zustand';
import { idbLoadQueue, idbSaveQueue } from '../lib/offline-db';

export interface OfflineSale {
  clientTxnId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
  conflict?: boolean;
  errorMessage?: string;
}

interface OfflineState {
  online: boolean;
  queue: OfflineSale[];
  setOnline: (online: boolean) => void;
  enqueue: (sale: OfflineSale) => void;
  markSynced: (clientTxnId: string) => void;
  markConflict: (clientTxnId: string, message?: string) => void;
  markFailed: (clientTxnId: string, message?: string) => void;
  clearResolved: () => void;
  load: () => void;
}

const KEY = 'haroti_offline_sales';

function migrateFromLocalStorage(): OfflineSale[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OfflineSale[];
    localStorage.removeItem(KEY);
    return parsed;
  } catch {
    return [];
  }
}

async function persistQueue(queue: OfflineSale[]) {
  await idbSaveQueue(queue);
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  online: navigator.onLine,
  queue: [],
  setOnline: (online) => set({ online }),
  enqueue: (sale) => {
    const queue = [...get().queue, sale];
    void persistQueue(queue);
    set({ queue });
  },
  markSynced: (clientTxnId) => {
    const queue = get().queue.map((s) =>
      s.clientTxnId === clientTxnId
        ? { ...s, synced: true, conflict: false, errorMessage: undefined }
        : s,
    );
    void persistQueue(queue);
    set({ queue });
  },
  markConflict: (clientTxnId, message) => {
    const queue = get().queue.map((s) =>
      s.clientTxnId === clientTxnId
        ? { ...s, conflict: true, errorMessage: message }
        : s,
    );
    void persistQueue(queue);
    set({ queue });
  },
  markFailed: (clientTxnId, message) => {
    const queue = get().queue.map((s) =>
      s.clientTxnId === clientTxnId
        ? { ...s, errorMessage: message }
        : s,
    );
    void persistQueue(queue);
    set({ queue });
  },
  clearResolved: () => {
    const queue = get().queue.filter((s) => !s.synced && !s.conflict);
    void persistQueue(queue);
    set({ queue });
  },
  load: () => {
    const legacy = migrateFromLocalStorage();
    void idbLoadQueue<OfflineSale>(legacy).then((queue) => {
      if (legacy.length) void persistQueue(queue);
      set({ queue });
    });
  },
}));
