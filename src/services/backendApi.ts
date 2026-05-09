import { auth } from '../lib/firebase';

export async function authFetch(path: string, init: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Please sign in again.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Backend request failed.');
  }

  return data;
}
