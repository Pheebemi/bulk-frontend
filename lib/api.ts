/**
 * Thin fetch wrapper for the Django backend (bulk-backend repo).
 * Not wired into the UI yet — the app currently runs on the mock store in
 * lib/store.tsx. Once the backend exists, swap the store's action bodies to
 * call these instead of mutating local state.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string }>('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) }),
  signup: (payload: { email: string; password: string; fullName: string; phoneNumber: string }) =>
    request<{ token: string }>('/api/auth/signup/', { method: 'POST', body: JSON.stringify(payload) }),
  fundWallet: (amountKobo: number) =>
    request<{ authorizationUrl: string }>('/api/wallet/fund/', { method: 'POST', body: JSON.stringify({ amount: amountKobo }) }),
  createCampaign: (payload: {
    senderId: string;
    message: string;
    channel: 'generic' | 'dnd';
    groupId?: string;
    manualNumbers?: string[];
  }) => request('/api/campaigns/', { method: 'POST', body: JSON.stringify(payload) }),
  fetchCampaignStatus: (campaignId: string) => request(`/api/campaigns/${campaignId}/`),
  requestSenderId: (payload: { name: string; useCase: string }) =>
    request('/api/sender-ids/', { method: 'POST', body: JSON.stringify(payload) }),
};
