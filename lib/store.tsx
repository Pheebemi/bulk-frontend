'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  api,
  ApiCampaign,
  ApiAdminCampaign,
  ApiContact,
  ApiContactGroup,
  ApiError,
  ApiSenderID,
  ApiAdminUser,
  ApiUser,
} from '@/lib/api';
import type {
  AdminCampaign,
  AdminUser,
  Campaign,
  CampaignChannel,
  Contact,
  ContactGroup,
  PlatformRate,
  SenderId,
  SenderIdStatus,
  SenderIdVisibility,
  SmsProvider,
} from '@/types';

type Result = { ok: true } | { ok: false; error: string };

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
}

function mapGroup(g: ApiContactGroup): ContactGroup {
  return { id: g.id, name: g.name, contactCount: g.contact_count };
}

function mapContact(c: ApiContact): Contact {
  return { id: c.id, firstName: c.first_name, lastName: c.last_name, phone: c.phone_number };
}

function mapSenderId(s: ApiSenderID): SenderId {
  return {
    id: s.id,
    name: s.name,
    useCase: s.use_case,
    visibility: s.visibility,
    provider: s.provider,
    status: s.platform_status,
    dndWhitelisted: s.termii_dnd_whitelisted,
    createdAt: s.created_at ?? '',
    userEmail: s.user_email,
    isShared: s.is_shared,
    isAdminOnly: s.is_admin_only,
  };
}

function mapCampaign(c: ApiCampaign): Campaign {
  return {
    id: c.id,
    name: c.message.slice(0, 32) || `Campaign #${c.id}`,
    channel: c.channel,
    senderId: c.sender_id,
    message: c.message,
    recipients: c.total_recipients,
    cost: parseFloat(c.total_cost),
    termiiCost: parseFloat(c.termii_cost),
    delivered: c.delivered,
    failed: c.failed,
    status: c.status,
    isAdminCampaign: c.is_admin_campaign,
    provider: c.provider,
    createdAt: c.created_at,
  };
}

function mapAdminCampaign(c: ApiAdminCampaign): AdminCampaign {
  return { ...mapCampaign(c), userEmail: c.user_email, providerError: c.provider_error };
}

function mapAdminUser(u: ApiAdminUser): AdminUser {
  return {
    id: u.id,
    name: u.full_name || u.email,
    email: u.email,
    balance: parseFloat(u.balance),
    history: u.history.map((h) => ({ id: h.id, description: h.description, amount: parseFloat(h.amount), createdAt: h.created_at })),
  };
}

// ---------------------------------------------------------------------------
// User store
// ---------------------------------------------------------------------------

interface UserStoreValue {
  authed: boolean;
  authChecked: boolean;
  /** False until the first post-login fetch of groups/senderIds/campaigns/
   *  rate has completed — lets pages show a loader instead of a false
   *  "nothing here yet" while that's still in flight. */
  dataLoaded: boolean;
  wallet: number;
  fullName: string;
  groups: ContactGroup[];
  senderIds: SenderId[];
  campaigns: Campaign[];
  /** True while there's a further page of campaigns beyond what's
   *  currently loaded — drives whether a "Load more" control shows. */
  campaignsHasMore: boolean;
  /** Real, all-time aggregates from the server (GET /api/auth/me/) —
   *  campaigns.length/reduce only ever covers whatever page is loaded
   *  now that this list is paginated, so these are the accurate totals
   *  the dashboard's stat cards actually need. */
  campaignsSentTotal: number;
  recipientsReachedTotal: number;
  rate: PlatformRate;
  login: (email: string, password: string) => Promise<Result>;
  signup: (email: string, password: string, fullName: string, phone: string) => Promise<Result>;
  logout: () => void;
  refreshWallet: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<ContactGroup | null>;
  addContact: (groupId: number, contact: { firstName: string; lastName: string; phone: string }) => Promise<void>;
  uploadCsv: (file: File, groupName: string) => Promise<Result>;
  /** A specific group's contacts, paginated — called when that group is
   *  expanded (and again for "Load more"), not kept in this store since
   *  only one group's contacts are ever being browsed at a time. */
  fetchGroupContacts: (groupId: number, page?: number) => Promise<{ contacts: Contact[]; hasMore: boolean }>;
  refreshSenderIds: () => Promise<void>;
  requestSenderId: (name: string, useCase: string) => Promise<Result>;
  refreshCampaigns: () => Promise<void>;
  loadMoreCampaigns: () => Promise<void>;
  createCampaign: (args: {
    senderId: string;
    channel: CampaignChannel;
    message: string;
    groupId?: number;
    manualNumbers?: string[];
  }) => Promise<{ ok: true; campaign: Campaign } | { ok: false; error: string }>;
  fetchCampaign: (id: number) => Promise<Campaign | null>;
  retryCampaign: (id: number) => Promise<Result>;
  verifyPayment: (transactionId: string, txRef: string) => Promise<Result>;
}

const UserStoreContext = createContext<UserStoreValue | null>(null);

export function UserStoreProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [wallet, setWallet] = useState(0);
  const [fullName, setFullName] = useState('');
  const [campaignsSentTotal, setCampaignsSentTotal] = useState(0);
  const [recipientsReachedTotal, setRecipientsReachedTotal] = useState(0);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsHasMore, setCampaignsHasMore] = useState(false);
  const [rate, setRate] = useState<PlatformRate>({ genericRate: 8, dndRate: 10 });
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadAll = async () => {
    const [groupsRes, senderIdsRes, campaignsRes, rateRes] = await Promise.allSettled([
      api.listContactGroups(),
      api.listSenderIds(),
      api.listCampaigns(),
      api.getRate(),
    ]);
    if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value.map(mapGroup));
    if (senderIdsRes.status === 'fulfilled') setSenderIds(senderIdsRes.value.map(mapSenderId));
    if (campaignsRes.status === 'fulfilled') {
      setCampaigns(campaignsRes.value.results.map(mapCampaign));
      setCampaignsPage(1);
      setCampaignsHasMore(campaignsRes.value.next !== null);
    }
    if (rateRes.status === 'fulfilled') setRate({ genericRate: parseFloat(rateRes.value.generic_rate), dndRate: parseFloat(rateRes.value.dnd_rate) });
    // Set once loadAll has actually run, success or partial failure alike —
    // Promise.allSettled never rejects, so this always fires.
    setDataLoaded(true);
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api
      .me()
      .then((user) => {
        setAuthed(true);
        setWallet(parseFloat(user.balance));
        setFullName(user.full_name);
        setCampaignsSentTotal(user.campaigns_sent);
        setRecipientsReachedTotal(user.recipients_reached);
        return loadAll();
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const applyAuth = (token: string, refresh: string, user: ApiUser) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refresh);
    setWallet(parseFloat(user.balance));
    setFullName(user.full_name);
    setCampaignsSentTotal(user.campaigns_sent);
    setRecipientsReachedTotal(user.recipients_reached);
    setAuthed(true);
    loadAll();
  };

  const login: UserStoreValue['login'] = async (email, password) => {
    try {
      const res = await api.login(email, password);
      applyAuth(res.token, res.refresh, res.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const signup: UserStoreValue['signup'] = async (email, password, full_name, phone_number) => {
    try {
      const res = await api.signup({ email, password, full_name, phone_number });
      applyAuth(res.token, res.refresh, res.user);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    setAuthed(false);
    setGroups([]);
    setSenderIds([]);
    setCampaigns([]);
    setCampaignsPage(1);
    setCampaignsHasMore(false);
    setCampaignsSentTotal(0);
    setRecipientsReachedTotal(0);
    setDataLoaded(false);
  };

  const refreshWallet = async () => {
    const user = await api.me();
    setWallet(parseFloat(user.balance));
    setCampaignsSentTotal(user.campaigns_sent);
    setRecipientsReachedTotal(user.recipients_reached);
  };

  const refreshGroups = async () => setGroups((await api.listContactGroups()).map(mapGroup));
  const refreshSenderIds = async () => setSenderIds((await api.listSenderIds()).map(mapSenderId));

  const refreshCampaigns = async () => {
    const page = await api.listCampaigns(1);
    setCampaigns(page.results.map(mapCampaign));
    setCampaignsPage(1);
    setCampaignsHasMore(page.next !== null);
  };

  const loadMoreCampaigns: UserStoreValue['loadMoreCampaigns'] = async () => {
    const nextPage = campaignsPage + 1;
    const page = await api.listCampaigns(nextPage);
    setCampaigns((c) => [...c, ...page.results.map(mapCampaign)]);
    setCampaignsPage(nextPage);
    setCampaignsHasMore(page.next !== null);
  };

  const fetchGroupContacts: UserStoreValue['fetchGroupContacts'] = async (groupId, page = 1) => {
    const result = await api.listGroupContacts(groupId, page);
    return { contacts: result.results.map(mapContact), hasMore: result.next !== null };
  };

  const createGroup: UserStoreValue['createGroup'] = async (name) => {
    const group = mapGroup(await api.createContactGroup(name));
    setGroups((g) => [...g, group]);
    return group;
  };

  const addContact: UserStoreValue['addContact'] = async (groupId, contact) => {
    await api.addContact(groupId, { first_name: contact.firstName, last_name: contact.lastName, phone_number: contact.phone });
    await refreshGroups();
  };

  const uploadCsv: UserStoreValue['uploadCsv'] = async (file, groupName) => {
    try {
      const group = mapGroup(await api.uploadContactsCsv(file, groupName));
      setGroups((g) => [...g, group]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const requestSenderId: UserStoreValue['requestSenderId'] = async (name, useCase) => {
    try {
      const senderId = mapSenderId(await api.requestSenderId(name, useCase));
      setSenderIds((s) => [...s, senderId]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const createCampaign: UserStoreValue['createCampaign'] = async ({ senderId, channel, message, groupId, manualNumbers }) => {
    try {
      const campaign = await api.createCampaign({
        sender_id: senderId,
        message,
        channel,
        group_id: groupId,
        manual_numbers: manualNumbers,
      });
      const mapped = mapCampaign(campaign);
      setCampaigns((c) => [mapped, ...c]);
      await refreshWallet();
      return { ok: true, campaign: mapped };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const fetchCampaign: UserStoreValue['fetchCampaign'] = async (id) => {
    try {
      const mapped = mapCampaign(await api.getCampaign(id));
      setCampaigns((cs) => cs.map((c) => (c.id === id ? mapped : c)));
      return mapped;
    } catch {
      return null;
    }
  };

  const retryCampaign: UserStoreValue['retryCampaign'] = async (id) => {
    try {
      const mapped = mapCampaign(await api.retryCampaign(id));
      setCampaigns((cs) => cs.map((c) => (c.id === id ? mapped : c)));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const verifyPayment: UserStoreValue['verifyPayment'] = async (transactionId, txRef) => {
    try {
      const res = await api.verifyPayment(transactionId, txRef);
      setWallet(parseFloat(res.balance));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const value = useMemo<UserStoreValue>(
    () => ({
      authed, authChecked, dataLoaded, wallet, fullName, groups, senderIds, campaigns, campaignsHasMore,
      campaignsSentTotal, recipientsReachedTotal, rate,
      login, signup, logout, refreshWallet, refreshGroups, createGroup, addContact, uploadCsv, fetchGroupContacts,
      refreshSenderIds, requestSenderId, refreshCampaigns, loadMoreCampaigns, createCampaign, fetchCampaign, retryCampaign, verifyPayment,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed, authChecked, dataLoaded, wallet, fullName, groups, senderIds, campaigns, campaignsHasMore, campaignsSentTotal, recipientsReachedTotal, rate],
  );

  return <UserStoreContext.Provider value={value}>{children}</UserStoreContext.Provider>;
}

export function useUserStore(): UserStoreValue {
  const ctx = useContext(UserStoreContext);
  if (!ctx) throw new Error('useUserStore must be used within UserStoreProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Admin store
// ---------------------------------------------------------------------------

interface AdminStoreValue {
  authed: boolean;
  authChecked: boolean;
  /** Same purpose as UserStoreValue.dataLoaded — false until the first
   *  post-login fetch of rate/senderIds/users/campaigns has completed. */
  dataLoaded: boolean;
  rate: PlatformRate;
  senderIds: SenderId[];
  users: AdminUser[];
  usersHasMore: boolean;
  /** Real total from the server — users.length is only how many have
   *  been loaded so far under the current search, not the true count. */
  usersTotal: number;
  adminCampaigns: Campaign[];
  adminCampaignsHasMore: boolean;
  adminCampaignsTotal: number;
  /** Every campaign on the platform, customer and admin sends alike —
   *  for the campaign monitor, distinct from adminCampaigns above
   *  (admin's own sends only, backing the Send screen's history). */
  allCampaigns: AdminCampaign[];
  allCampaignsHasMore: boolean;
  /** Real total for whichever status_group filter is currently active
   *  (see refreshAllCampaigns) — not the grand total across both. */
  allCampaignsTotal: number;
  /** Dashboard overview aggregates — real DB sums/counts, not derived
   *  from users/adminCampaigns client-side (both paginated now). */
  stats: { totalUsers: number; totalBalance: number; adminSmsSent: number };
  login: (email: string, password: string) => Promise<Result>;
  logout: () => void;
  refreshSenderIds: () => Promise<void>;
  /** Adds a new row directly — a shared or admin-only pool entry, or a
   *  private one on a customer's behalf (user_email required for that
   *  case). This is how the shared/admin-only pools grow now, instead of
   *  a code change to a hardcoded list. */
  createSenderId: (payload: {
    name: string;
    visibility: SenderIdVisibility;
    provider: SmsProvider;
    platformStatus?: SenderIdStatus;
    userEmail?: string;
  }) => Promise<Result>;
  /** Edits any field on an existing row — provider, status, DND
   *  whitelisting, visibility, even reassigning the owning customer. */
  updateSenderId: (
    id: number,
    patch: Partial<{
      name: string;
      visibility: SenderIdVisibility;
      provider: SmsProvider;
      platformStatus: SenderIdStatus;
      dndWhitelisted: boolean;
      userEmail: string | null;
    }>,
  ) => Promise<Result>;
  deleteSenderId: (id: number) => Promise<Result>;
  /** Resets to page 1 under a new search term (empty string clears it) —
   *  search runs server-side now that the list is paginated, so it has
   *  to be a fresh fetch, not a filter over whatever page is loaded. */
  refreshUsers: (search?: string) => Promise<void>;
  loadMoreUsers: () => Promise<void>;
  adjustUserBalance: (userId: number, amount: number, direction: 'credit' | 'debit', reason: string) => Promise<Result>;
  setRate: (rate: PlatformRate) => Promise<Result>;
  refreshAdminCampaigns: () => Promise<void>;
  loadMoreAdminCampaigns: () => Promise<void>;
  /** Resets to page 1 under a new status filter — same reasoning as
   *  refreshUsers: server-side now that the list is paginated. */
  refreshAllCampaigns: (statusGroup?: 'failed') => Promise<void>;
  loadMoreAllCampaigns: () => Promise<void>;
  sendCampaign: (args: {
    senderId: string;
    channel: CampaignChannel;
    message: string;
    manualNumbers?: string[];
    recipientCount?: number;
  }) => Promise<Result>;
}

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [rate, setRateState] = useState<PlatformRate>({ genericRate: 8, dndRate: 10 });
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [usersTotal, setUsersTotal] = useState(0);
  const [adminCampaigns, setAdminCampaigns] = useState<Campaign[]>([]);
  const [adminCampaignsPage, setAdminCampaignsPage] = useState(1);
  const [adminCampaignsHasMore, setAdminCampaignsHasMore] = useState(false);
  const [adminCampaignsTotal, setAdminCampaignsTotal] = useState(0);
  const [allCampaigns, setAllCampaigns] = useState<AdminCampaign[]>([]);
  const [allCampaignsPage, setAllCampaignsPage] = useState(1);
  const [allCampaignsStatusGroup, setAllCampaignsStatusGroup] = useState<'failed' | undefined>(undefined);
  const [allCampaignsHasMore, setAllCampaignsHasMore] = useState(false);
  const [allCampaignsTotal, setAllCampaignsTotal] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, totalBalance: 0, adminSmsSent: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadAll = async () => {
    const [rateRes, sidRes, usersRes, campaignsRes, allCampaignsRes, statsRes] = await Promise.allSettled([
      api.adminGetRate(),
      api.adminListSenderIds(),
      api.adminListUsers(1),
      api.adminListCampaigns(1),
      api.adminListAllCampaigns(1),
      api.adminGetStats(),
    ]);
    if (statsRes.status === 'fulfilled') {
      setStats({
        totalUsers: statsRes.value.total_users,
        totalBalance: parseFloat(statsRes.value.total_balance),
        adminSmsSent: statsRes.value.admin_sms_sent,
      });
    }
    if (rateRes.status === 'fulfilled') setRateState({ genericRate: parseFloat(rateRes.value.generic_rate), dndRate: parseFloat(rateRes.value.dnd_rate) });
    if (sidRes.status === 'fulfilled') setSenderIds(sidRes.value.map(mapSenderId));
    if (usersRes.status === 'fulfilled') {
      setUsers(usersRes.value.results.map(mapAdminUser));
      setUsersPage(1);
      setUsersHasMore(usersRes.value.next !== null);
      setUsersTotal(usersRes.value.count);
    }
    if (campaignsRes.status === 'fulfilled') {
      setAdminCampaigns(campaignsRes.value.results.map(mapCampaign));
      setAdminCampaignsPage(1);
      setAdminCampaignsHasMore(campaignsRes.value.next !== null);
      setAdminCampaignsTotal(campaignsRes.value.count);
    }
    if (allCampaignsRes.status === 'fulfilled') {
      setAllCampaigns(allCampaignsRes.value.results.map(mapAdminCampaign));
      setAllCampaignsPage(1);
      setAllCampaignsHasMore(allCampaignsRes.value.next !== null);
      setAllCampaignsTotal(allCampaignsRes.value.count);
    }
    setDataLoaded(true);
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminAuthToken') : null;
    if (!token) {
      setAuthChecked(true);
      return;
    }
    api
      .adminGetRate()
      .then(() => {
        setAuthed(true);
        return loadAll();
      })
      .catch(() => {
        localStorage.removeItem('adminAuthToken');
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const login: AdminStoreValue['login'] = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (!res.user.is_staff) return { ok: false, error: 'This account is not an admin account.' };
      localStorage.setItem('adminAuthToken', res.token);
      setAuthed(true);
      await loadAll();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAuthToken');
    setAuthed(false);
    setDataLoaded(false);
  };

  const refreshSenderIds = async () => setSenderIds((await api.adminListSenderIds()).map(mapSenderId));

  const refreshUsers: AdminStoreValue['refreshUsers'] = async (search = usersSearch) => {
    const page = await api.adminListUsers(1, search);
    setUsers(page.results.map(mapAdminUser));
    setUsersPage(1);
    setUsersSearch(search);
    setUsersHasMore(page.next !== null);
    setUsersTotal(page.count);
  };

  const loadMoreUsers: AdminStoreValue['loadMoreUsers'] = async () => {
    const nextPage = usersPage + 1;
    const page = await api.adminListUsers(nextPage, usersSearch);
    setUsers((u) => [...u, ...page.results.map(mapAdminUser)]);
    setUsersPage(nextPage);
    setUsersHasMore(page.next !== null);
  };

  const refreshAdminCampaigns = async () => {
    const page = await api.adminListCampaigns(1);
    setAdminCampaigns(page.results.map(mapCampaign));
    setAdminCampaignsPage(1);
    setAdminCampaignsHasMore(page.next !== null);
    setAdminCampaignsTotal(page.count);
  };

  const loadMoreAdminCampaigns: AdminStoreValue['loadMoreAdminCampaigns'] = async () => {
    const nextPage = adminCampaignsPage + 1;
    const page = await api.adminListCampaigns(nextPage);
    setAdminCampaigns((c) => [...c, ...page.results.map(mapCampaign)]);
    setAdminCampaignsPage(nextPage);
    setAdminCampaignsHasMore(page.next !== null);
  };

  const refreshAllCampaigns: AdminStoreValue['refreshAllCampaigns'] = async (statusGroup) => {
    const page = await api.adminListAllCampaigns(1, statusGroup);
    setAllCampaigns(page.results.map(mapAdminCampaign));
    setAllCampaignsPage(1);
    setAllCampaignsStatusGroup(statusGroup);
    setAllCampaignsHasMore(page.next !== null);
    setAllCampaignsTotal(page.count);
  };

  const loadMoreAllCampaigns: AdminStoreValue['loadMoreAllCampaigns'] = async () => {
    const nextPage = allCampaignsPage + 1;
    const page = await api.adminListAllCampaigns(nextPage, allCampaignsStatusGroup);
    setAllCampaigns((c) => [...c, ...page.results.map(mapAdminCampaign)]);
    setAllCampaignsPage(nextPage);
    setAllCampaignsHasMore(page.next !== null);
  };

  const createSenderId: AdminStoreValue['createSenderId'] = async ({ name, visibility, provider, platformStatus, userEmail }) => {
    try {
      const created = mapSenderId(
        await api.adminCreateSenderId({
          name,
          visibility,
          provider,
          platform_status: platformStatus,
          user_email: userEmail,
        }),
      );
      setSenderIds((s) => [created, ...s]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const updateSenderId: AdminStoreValue['updateSenderId'] = async (id, patch) => {
    try {
      const updated = mapSenderId(
        await api.adminUpdateSenderId(id, {
          name: patch.name,
          visibility: patch.visibility,
          provider: patch.provider,
          platform_status: patch.platformStatus,
          termii_dnd_whitelisted: patch.dndWhitelisted,
          user_email: patch.userEmail,
        }),
      );
      setSenderIds((s) => s.map((x) => (x.id === id ? updated : x)));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const deleteSenderId: AdminStoreValue['deleteSenderId'] = async (id) => {
    try {
      await api.adminDeleteSenderId(id);
      setSenderIds((s) => s.filter((x) => x.id !== id));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const adjustUserBalance: AdminStoreValue['adjustUserBalance'] = async (userId, amount, direction, reason) => {
    try {
      await api.adminAdjustWallet(userId, String(amount), direction, reason);
      await refreshUsers();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const setRate: AdminStoreValue['setRate'] = async (newRate) => {
    try {
      const res = await api.adminSetRate({ generic_rate: String(newRate.genericRate), dnd_rate: String(newRate.dndRate) });
      setRateState({ genericRate: parseFloat(res.generic_rate), dndRate: parseFloat(res.dnd_rate) });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const sendCampaign: AdminStoreValue['sendCampaign'] = async ({ senderId, channel, message, manualNumbers, recipientCount }) => {
    try {
      const campaign = await api.adminCreateCampaign({
        sender_id: senderId,
        message,
        channel,
        manual_numbers: manualNumbers,
        recipient_count: recipientCount,
      });
      setAdminCampaigns((c) => [mapCampaign(campaign), ...c]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  };

  const value = useMemo<AdminStoreValue>(
    () => ({
      authed, authChecked, dataLoaded, rate, senderIds,
      users, usersHasMore, usersTotal,
      adminCampaigns, adminCampaignsHasMore, adminCampaignsTotal,
      allCampaigns, allCampaignsHasMore, allCampaignsTotal, stats,
      login, logout, refreshSenderIds, createSenderId, updateSenderId, deleteSenderId, refreshUsers, loadMoreUsers, adjustUserBalance, setRate,
      refreshAdminCampaigns, loadMoreAdminCampaigns, refreshAllCampaigns, loadMoreAllCampaigns, sendCampaign,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed, authChecked, dataLoaded, rate, senderIds, users, usersHasMore, usersTotal,
      adminCampaigns, adminCampaignsHasMore, adminCampaignsTotal, allCampaigns, allCampaignsHasMore, allCampaignsTotal, stats],
  );

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore(): AdminStoreValue {
  const ctx = useContext(AdminStoreContext);
  if (!ctx) throw new Error('useAdminStore must be used within AdminStoreProvider');
  return ctx;
}
