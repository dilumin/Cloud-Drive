import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { getAccessToken, setAccessToken, clearAccessToken } from '../features/auth/tokenStore';

let refreshing: Promise<string | null> | null = null;

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = getAccessToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(`${env.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true });
    const token = res.data?.accessToken as string | undefined;
    if (token) {
      setAccessToken(token);
      return token;
    }
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as any;

    if (status === 401 && !original?._retry) {
      original._retry = true;

      if (!refreshing) {
        refreshing = refreshAccessToken().finally(() => {
          refreshing = null;
        });
      }

      const token = await refreshing;
      if (token) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${token}`;
        return api.request(original);
      }
    }

    throw error;
  }
);
