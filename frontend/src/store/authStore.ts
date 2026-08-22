import { create } from 'zustand';
import type { User } from '../types/user';
import { login as loginApi } from '../services/authService';

const TOKEN_KEY = 'crimeintel_token';

let _token: string | null = localStorage.getItem(TOKEN_KEY);

export function getToken(): string | null {
  return _token;
}

export function setTokenValue(token: string | null): void {
  _token = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await loginApi(email, password);
    const token = response.access_token;
    const user = response.user;

    setTokenValue(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    setTokenValue(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: user !== null }),

  setToken: (token) => {
    setTokenValue(token);
    set({ token, isAuthenticated: token !== null });
  },

  initialize: () => {
    const token = getToken();
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));
