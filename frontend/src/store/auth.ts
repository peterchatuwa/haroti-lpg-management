import { create } from 'zustand';
import type { AuthUser } from '../lib/types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setSession: (token, user) => {
    localStorage.setItem('haroti_token', token);
    localStorage.setItem('haroti_user', JSON.stringify(user));
    set({ token, user });
  },
  clearSession: () => {
    localStorage.removeItem('haroti_token');
    localStorage.removeItem('haroti_user');
    set({ token: null, user: null });
  },
  hydrate: () => {
    const token = localStorage.getItem('haroti_token');
    const raw = localStorage.getItem('haroti_user');
    set({
      token,
      user: raw ? (JSON.parse(raw) as AuthUser) : null,
    });
  },
}));
