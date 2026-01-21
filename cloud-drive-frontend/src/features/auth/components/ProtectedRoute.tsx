import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { getAccessToken } from '../tokenStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !getAccessToken()) {
      nav('/login', { replace: true, state: { from: loc.pathname } });
    }
  }, [loading, nav, loc.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-zinc-600">Loading…</div>
      </div>
    );
  }

  if (!getAccessToken()) return null;
  return <>{children}</>;
}
