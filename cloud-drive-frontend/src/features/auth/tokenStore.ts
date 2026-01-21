const KEY = 'cloud_drive_access_token';

let inMemory: string | null = null;

export function getAccessToken(): string | null {
  if (inMemory) return inMemory;
  const ls = localStorage.getItem(KEY);
  if (ls) inMemory = ls;
  return inMemory;
}

export function setAccessToken(token: string) {
  inMemory = token;
  localStorage.setItem(KEY, token);
}

export function clearAccessToken() {
  inMemory = null;
  localStorage.removeItem(KEY);
}
