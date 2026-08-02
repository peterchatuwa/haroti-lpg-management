import { create } from 'zustand';

export interface OfflineSale {
  clientTxnId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  synced: boolean;
}

interface OfflineState {
  online: boolean;
  queue: OfflineSale[];
  setOnline: (online: boolean) => void;
  enqueue: (sale: OfflineSale) => void;
  markSynced: (clientTxnId: string) => void;
  load: () => void;
}

const KEY = 'haroti_offline_sales';

export const useOfflineStore = create<OfflineState>((set, get) => ({
  online: navigator.onLine,
  queue: [],
  setOnline: (online) => set({ online }),
  enqueue: (sale) => {
    const queue = [...get().queue, sale];
    localStorage.setItem(KEY, JSON.stringify(queue));
    set({ queue });
  },
  markSynced: (clientTxnId) => {
    const queue = get().queue.map((s) =>
      s.clientTxnId === clientTxnId ? { ...s, synced: true } : s,
    );
    localStorage.setItem(KEY, JSON.stringify(queue));
    set({ queue });
  },
  load: () => {
    const raw = localStorage.getItem(KEY);
    set({ queue: raw ? (JSON.parse(raw) as OfflineSale[]) : [] });
  },
}));
