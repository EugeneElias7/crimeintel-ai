import { create } from 'zustand';
import type { User } from '../types/user';
import { login as loginApi } from '../services/authService';
import { getMe } from '../services/authService';

function normalizeUser(raw: any): User {
  if (!raw) return raw;
  const roleRaw = (raw.role || raw.Role || "OFFICER") as string;
  const roleNorm = roleRaw.toUpperCase() === "POLICE_OFFICER" ? "OFFICER" : roleRaw.toUpperCase() as User["role"];
  // map backend status -> account_status
  const statusRaw = (raw.status || raw.account_status || "active") as string;
  const statusMap: Record<string, User["account_status"]> = {
    active: "APPROVED",
    APPROVED: "APPROVED",
    PENDING_DOCUMENT: "PENDING_DOCUMENT",
    PENDING_VERIFICATION: "PENDING_VERIFICATION",
    REJECTED: "REJECTED",
    SUSPENDED: "SUSPENDED",
  };
  const account_status = statusMap[statusRaw] || statusMap[statusRaw.toUpperCase()] || "APPROVED";
  return {
    id: raw.user_id || raw.ROWID || raw.id || 0,
    username: raw.username || raw.display_name?.toLowerCase().replace(/\s+/g, "_") || raw.email?.split("@")[0] || "user",
    email: raw.email || "",
    full_name: raw.display_name || raw.full_name || raw.username || raw.email?.split("@")[0] || "Operator",
    employee_id: raw.badge_number || raw.employee_id || "",
    department: raw.department || "Karnataka State Police",
    designation: raw.designation || raw.role || "",
    role: roleNorm,
    account_status,
    is_active: raw.is_active ?? raw.status !== "suspended",
    created_at: raw.created_at || new Date().toISOString(),
  } as User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await loginApi(email, password);
    const token = response.access_token;
    const rawUser: any = (response as any).user;
    const user = normalizeUser(rawUser);

    localStorage.setItem('crimeintel_token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('crimeintel_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user, isAuthenticated: user !== null }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('crimeintel_token', token);
    } else {
      localStorage.removeItem('crimeintel_token');
    }
    set({ token, isAuthenticated: token !== null });
  },

  initialize: async () => {
    const token = localStorage.getItem('crimeintel_token');
    if (token) {
      set({ token, isAuthenticated: true });
      try {
        const res: any = await getMe();
        // Handle both response formats: { data: User } or direct User object or { user: User }
        const raw = res.data || res.user || res;
        const userData = normalizeUser(raw);
        localStorage.setItem('crimeintel_token', token);
        set({ user: userData, token, isAuthenticated: true });
      } catch (error) {
        localStorage.removeItem('crimeintel_token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

export function getToken(): string | null {
  return localStorage.getItem('crimeintel_token');
}

export function setTokenValue(token: string | null): void {
  if (token) {
    localStorage.setItem('crimeintel_token', token);
  } else {
    localStorage.removeItem('crimeintel_token');
  }
}