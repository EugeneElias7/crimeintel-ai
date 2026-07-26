import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../services/authService';
import type { User } from '../types/user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, login, logout, setUser, setToken, initialize } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      initialize();
      const token = useAuthStore.getState().token;
      if (token) {
        try {
          const res = await getMe();
          setUser(res.data);
        } catch {
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    init();
  }, [initialize, setUser, setToken]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
