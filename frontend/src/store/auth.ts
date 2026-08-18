import { create } from 'zustand';
import type { AuthUser } from '../lib/types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
  hydrate: () => void;
}

function readStoredSession(): Pick<AuthState, 'token' | 'user'> {
  try {
    const token = localStorage.getItem('haroti_token');
    const raw = localStorage.getItem('haroti_user');
    return {
      token,
      user: raw ? (JSON.parse(raw) as AuthUser) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

const storedSession = readStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  token: storedSession.token,
  user: storedSession.user,
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
    set(readStoredSession());
  },
}));
