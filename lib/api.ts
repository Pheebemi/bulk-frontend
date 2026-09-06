/**
 * Real fetch client for the Django backend (bulk-backend repo). Every
 * function here matches an actual endpoint verified against a running
 * instance — see PROJECT_SPEC.md for the design behind each one.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Admin and user sessions are independent (see lib/store.tsx) — admin
  // endpoints are consistently namespaced under /api/admin/, so route the
  // right token to the right calls without threading it through every
  // call site.
  const tokenKey = path.startsWith('/api/admin/') ? 'adminAuthToken' : 'authToken';
  const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(detail, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface ApiUser {
  id: number;
  email: string;
  full_name: string;
  phone_number: string | null;
  is_staff: boolean;
  balance: string;
  campaigns_sent: number;
  recipients_reached: number;
}

export interface AuthResponse {
  token: string;
  refresh: string;
  user: ApiUser;
}

export interface ApiContact {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface ApiContactGroup {
  id: number;
  name: string;
  termii_phonebook_id: string | null;
  created_at: string;
  // No nested contact list — a group's contacts are unbounded by design,
  // so they're fetched separately (paginated) via listGroupContacts,
  // only once that group is actually expanded.
  contact_count: number;
}

/** The shape every paginated list endpoint returns. */
export interface ApiPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiSenderID {
  id: number;
  name: string;
  // Admin-only — what the request's for, so Admin knows what to submit
  // on whichever provider's dashboard. Absent from the customer-facing
  // GET /api/sender-ids/ response.
  use_case?: string;
  // Admin-only too — the customer-facing list never includes this field.
  visibility?: 'private' | 'shared' | 'admin_only';
  provider: 'termii' | 'sendchamp' | 'kudisms';
  platform_status: 'active' | 'pending' | 'blocked';
  termii_dnd_whitelisted: boolean;
  // Null for the shared, no-approval-needed sender IDs (synthetic
  // entries — not a stored row, so there's no creation date).
  created_at: string | null;
  user_email?: string;
  is_shared: boolean;
  is_admin_only?: boolean;
}

export interface ApiSMSLog {
  id: number;
  recipient: string;
  provider_msg_id: string | null;
  status: string;
  sent_at: string;
}

export interface ApiCampaign {
  id: number;
  is_admin_campaign: boolean;
  provider: 'termii' | 'sendchamp' | 'kudisms';
  sender_id: string;
  message: string;
  channel: 'generic' | 'dnd';
  termii_campaign_id: string | null;
  total_recipients: number;
  delivered: number;
  failed: number;
  total_cost: string;
  termii_cost: string;
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'PARTIAL' | 'FAILED';
  created_at: string;
  // Only present on GET /api/campaigns/<id>/ (CampaignDetailSerializer)
  // — every list endpoint omits it, a large campaign can have
  // thousands of these and nothing on a list page reads them.
  logs?: ApiSMSLog[];
}

/** GET /api/admin/all-campaigns/ only — never a customer-facing response. */
export interface ApiAdminCampaign extends ApiCampaign {
  user_email: string;
  provider_error: string;
}

/** Real DB aggregates for the admin dashboard's overview cards — not
 *  derivable client-side any more now that users/campaigns are paginated. */
export interface ApiAdminStats {
  total_users: number;
  total_balance: string;
  admin_sms_sent: number;
}

export interface ApiRate {
  generic_rate: string;
  dnd_rate: string;
  updated_at: string;
}

export interface ApiWalletHistoryEntry {
  id: number;
  amount: string;
  description: string;
  created_at: string;
}

export interface ApiAdminUser {
  id: number;
  email: string;
  full_name: string;
  phone_number: string | null;
  balance: string;
  history: ApiWalletHistoryEntry[];
}

export const api = {
  signup: (payload: { email: string; password: string; full_name: string; phone_number?: string }) =>
    request<AuthResponse>('/api/auth/signup/', { method: 'POST', body: JSON.stringify(payload) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<ApiUser>('/api/auth/me/'),

  listContactGroups: () => request<ApiContactGroup[]>('/api/contact-groups/'),
  createContactGroup: (name: string) =>
    request<ApiContactGroup>('/api/contact-groups/', { method: 'POST', body: JSON.stringify({ name }) }),
  addContact: (groupId: number, contact: { first_name: string; last_name: string; phone_number: string }) =>
    request<ApiContact>(`/api/contact-groups/${groupId}/contacts/`, { method: 'POST', body: JSON.stringify(contact) }),
  // Paginated — fetched only once a group is expanded, not up front for
  // every group the way it briefly worked before.
  listGroupContacts: (groupId: number, page = 1) =>
    request<ApiPage<ApiContact>>(`/api/contact-groups/${groupId}/contacts/?page=${page}`),
  uploadContactsCsv: (file: File, groupName: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('group_name', groupName);
    return request<ApiContactGroup>('/api/contact-groups/upload-csv/', { method: 'POST', body: form });
  },

  listSenderIds: () => request<ApiSenderID[]>('/api/sender-ids/'),
  requestSenderId: (name: string, use_case: string) =>
    request<ApiSenderID>('/api/sender-ids/', { method: 'POST', body: JSON.stringify({ name, use_case }) }),

  getRate: () => request<ApiRate>('/api/rate/'),

  listCampaigns: (page = 1) => request<ApiPage<ApiCampaign>>(`/api/campaigns/?page=${page}`),
  adminListAllCampaigns: (page = 1, statusGroup?: 'failed') =>
    request<ApiPage<ApiAdminCampaign>>(`/api/admin/all-campaigns/?page=${page}${statusGroup ? `&status_group=${statusGroup}` : ''}`),
  createCampaign: (payload: {
    sender_id: string;
    message: string;
    channel: 'generic' | 'dnd';
    group_id?: number;
    manual_numbers?: string[];
  }) => request<ApiCampaign>('/api/campaigns/', { method: 'POST', body: JSON.stringify(payload) }),
  getCampaign: (id: number) => request<ApiCampaign>(`/api/campaigns/${id}/`),
  retryCampaign: (id: number) => request<ApiCampaign>(`/api/campaigns/${id}/retry/`, { method: 'POST' }),

  verifyPayment: (transaction_id: string, tx_ref: string) =>
    request<{ balance: string; tx_ref: string }>('/api/wallet/verify/', {
      method: 'POST',
      body: JSON.stringify({ transaction_id, tx_ref }),
    }),

  // Admin — full CRUD: every Sender ID row (private/shared/admin_only
  // alike), whoever it belongs to. Create is how Admin adds a new shared
  // or admin-only pool entry, or a private one on a customer's behalf,
  // directly — no code change needed the way DEFAULT_SENDER_IDS/
  // ADMIN_ONLY_SENDER_IDS used to require.
  adminListSenderIds: () => request<ApiSenderID[]>('/api/admin/sender-ids/'),
  adminCreateSenderId: (payload: {
    name: string;
    visibility: 'private' | 'shared' | 'admin_only';
    provider: 'termii' | 'sendchamp' | 'kudisms';
    platform_status?: 'active' | 'pending' | 'blocked';
    user_email?: string;
  }) => request<ApiSenderID>('/api/admin/sender-ids/', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateSenderId: (
    id: number,
    payload: Partial<{
      name: string;
      visibility: 'private' | 'shared' | 'admin_only';
      provider: 'termii' | 'sendchamp' | 'kudisms';
      platform_status: 'active' | 'pending' | 'blocked';
      termii_dnd_whitelisted: boolean;
      user_email: string | null;
    }>,
  ) => request<ApiSenderID>(`/api/admin/sender-ids/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  adminDeleteSenderId: (id: number) => request<void>(`/api/admin/sender-ids/${id}/`, { method: 'DELETE' }),
  adminGetRate: () => request<ApiRate>('/api/admin/rate/'),
  adminGetStats: () => request<ApiAdminStats>('/api/admin/stats/'),
  adminSetRate: (payload: { generic_rate: string; dnd_rate: string }) =>
    request<ApiRate>('/api/admin/rate/', { method: 'PUT', body: JSON.stringify(payload) }),
  adminListUsers: (page = 1, search = '') =>
    request<ApiPage<ApiAdminUser>>(`/api/admin/users/?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  adminAdjustWallet: (userId: number, amount: string, direction: 'credit' | 'debit', reason: string) =>
    request<{ balance: string }>(`/api/admin/users/${userId}/wallet/`, {
      method: 'POST',
      body: JSON.stringify({ amount, direction, reason }),
    }),
  adminListCampaigns: (page = 1) => request<ApiPage<ApiCampaign>>(`/api/admin/campaigns/?page=${page}`),
  adminCreateCampaign: (payload: {
    sender_id: string;
    message: string;
    channel: 'generic' | 'dnd';
    manual_numbers?: string[];
    recipient_count?: number;
  }) => request<ApiCampaign>('/api/admin/campaigns/', { method: 'POST', body: JSON.stringify(payload) }),
};
