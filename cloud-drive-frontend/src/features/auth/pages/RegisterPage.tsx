import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../auth-context';

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    if (password !== confirm) {
      setErr('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(email, password);
      setOk('Account created. Redirecting to sign in…');
      setTimeout(() => nav('/login'), 700);
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create account">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        {ok && <div className="text-sm text-emerald-600">{ok}</div>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      <div className="mt-4 text-sm text-zinc-600">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
