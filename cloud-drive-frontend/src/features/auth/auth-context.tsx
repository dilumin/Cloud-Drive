import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from './auth-api';
import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStore';
import axios from 'axios';
import { env } from '../../lib/env';

type AuthState = {
  user: authApi.AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [bootstrapping, setBootstrapping] = useState(true);

  // Silent bootstrap: if refresh cookie exists, obtain a fresh access token on page load.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!getAccessToken()) {
          const res = await axios.post(`${env.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true });
          const token = res.data?.accessToken as string | undefined;
          if (token) setAccessToken(token);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const userQuery = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: !bootstrapping && !!getAccessToken()
  });

  const login = async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password);
    setAccessToken(accessToken);
    await qc.invalidateQueries({ queryKey: ['me'] });
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAccessToken();
      qc.clear();
    }
  };

  const value = useMemo<AuthState>(
    () => ({
      user: userQuery.data ?? null,
      loading: bootstrapping || userQuery.isLoading,
      login,
      register,
      logout
    }),
    [userQuery.data, userQuery.isLoading, bootstrapping]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
