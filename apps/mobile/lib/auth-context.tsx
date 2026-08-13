import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from './api';
import { tokenStorage } from './token-storage';

const TOKEN_KEY = 'pulso_access_token';

interface AuthUser {
  id: string;
  email: string;
  timezone: string;
  quitMotivation: string | null;
  quitDate: string | null;
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, timezone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  async function loadUser() {
    try {
      const me = await api.get<AuthUser>('/auth/me');
      setUser(me);
    } catch {
      setUser(null);
      setAuthToken(null);
      await tokenStorage.deleteItemAsync(TOKEN_KEY);
    }
  }

  useEffect(() => {
    (async () => {
      const stored = await tokenStorage.getItemAsync(TOKEN_KEY);
      if (stored) {
        setAuthToken(stored);
        await loadUser();
      }
      setIsLoading(false);
    })();
  }, []);

  async function persistToken(token: string) {
    setAuthToken(token);
    await tokenStorage.setItemAsync(TOKEN_KEY, token);
    await loadUser();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      user,
      async login(email, password) {
        const res = await api.post<{ accessToken: string }>('/auth/login', { email, password });
        await persistToken(res.accessToken);
      },
      async register(email, password, timezone) {
        const res = await api.post<{ accessToken: string }>('/auth/register', { email, password, timezone });
        await persistToken(res.accessToken);
      },
      async logout() {
        setAuthToken(null);
        setUser(null);
        await tokenStorage.deleteItemAsync(TOKEN_KEY);
      },
      refreshUser: loadUser,
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
