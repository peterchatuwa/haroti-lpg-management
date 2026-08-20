import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  detail?: string;
  reference?: string;
  duration: number | null;
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  update: (id: string, patch: Partial<Omit<ToastItem, 'id' | 'createdAt'>>) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

let toastCounter = 0;

function nextId() {
  toastCounter += 1;
  return `toast-${Date.now()}-${toastCounter}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, createdAt: Date.now() }].slice(-5),
    }));
    return id;
  },
  update: (id, patch) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  },
  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clear: () => set({ toasts: [] }),
}));
