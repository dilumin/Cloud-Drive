import { api } from '../../lib/api';

export type AuthUser = { id: string; email: string; createdAt?: string };

export async function register(email: string, password: string) {
  const res = await api.post('/auth/register', { email, password });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await api.post('/auth/login', { email, password });
  return res.data as { accessToken: string; userId: string };
}

export async function logout() {
  const res = await api.post('/auth/logout', {});
  return res.data;
}

export async function me() {
  const res = await api.get('/auth/me');
  return res.data as AuthUser;
}
