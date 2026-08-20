import { create } from 'zustand';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmOptions {
  title: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  request: (options: ConfirmOptions) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  request: (options) =>
    new Promise<boolean>((resolve) => {
      const current = get();
      if (current.open && current.resolve) {
        current.resolve(false);
      }
      set({ open: true, options, resolve });
    }),
  close: (result) => {
    const { resolve } = get();
    resolve?.(result);
    set({ open: false, options: null, resolve: null });
  },
}));
