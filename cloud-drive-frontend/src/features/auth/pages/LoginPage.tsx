import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../auth-context';

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      nav(loc.state?.from || '/drive', { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-4 text-sm text-zinc-600">
        No account?{' '}
        <Link to="/register" className="text-blue-600 font-medium hover:underline">
          Create one
        </Link>
      </div>
    </AuthLayout>
  );
}
