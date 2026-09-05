'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  api,
  ApiCampaign,
  ApiContactGroup,
  ApiError,
  ApiSenderID,
  ApiAdminUser,
} from '@/lib/api';
import type {
  AdminUser,
  Campaign,
  CampaignChannel,
  ContactGroup,
  PlatformRate,
  SenderId,
} from '@/types';

type Result = { ok: true } | { ok: false; error: string };

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Something went wrong. Please try again.';
}

function mapGroup(g: ApiContactGroup): ContactGroup {
  return {
    id: g.id,
    name: g.name,
    contactCount: g.contact_count,
    contacts: g.contacts.map((c) => ({ id: c.id, firstName: c.first_name, lastName: c.last_name, phone: c.phone_number })),
  };
}

function mapSenderId(s: ApiSenderID): SenderId {
  return {
    id: s.id,
    name: s.name,
    status: s.platform_status,
    dndWhitelisted: s.termii_dnd_whitelisted,
    createdAt: s.created_at,
    userEmail: s.user_email,
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
    createdAt: c.created_at,
  };
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
  wallet: number;
  fullName: string;
  groups: ContactGroup[];
  senderIds: SenderId[];
  campaigns: Campaign[];
  rate: PlatformRate;
  login: (email: string, password: string) => Promise<Result>;
  signup: (email: string, password: string, fullName: string, phone: string) => Promise<Result>;
  logout: () => void;
  refreshWallet: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  createGroup: (name: string) => Promise<ContactGroup | null>;
  addContact: (groupId: number, contact: { firstName: string; lastName: string; phone: string }) => Promise<void>;
  uploadCsv: (file: File, groupName: string) => Promise<Result>;
  refreshSenderIds: () => Promise<void>;
  requestSenderId: (name: string, useCase: string) => Promise<Result>;
  refreshCampaigns: () => Promise<void>;
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
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rate, setRate] = useState<PlatformRate>({ genericRate: 8, dndRate: 10 });

  const loadAll = async () => {
    const [groupsRes, senderIdsRes, campaignsRes, rateRes] = await Promise.allSettled([
      api.listContactGroups(),
      api.listSenderIds(),
      api.listCampaigns(),
      api.getRate(),
    ]);
    if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value.map(mapGroup));
    if (senderIdsRes.status === 'fulfilled') setSenderIds(senderIdsRes.value.map(mapSenderId));
    if (campaignsRes.status === 'fulfilled') setCampaigns(campaignsRes.value.map(mapCampaign));
    if (rateRes.status === 'fulfilled') setRate({ genericRate: parseFloat(rateRes.value.generic_rate), dndRate: parseFloat(rateRes.value.dnd_rate) });
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
        return loadAll();
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const applyAuth = (token: string, refresh: string, user: { balance: string; full_name: string }) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refresh);
    setWallet(parseFloat(user.balance));
    setFullName(user.full_name);
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
  };

  const refreshWallet = async () => {
    const user = await api.me();
    setWallet(parseFloat(user.balance));
  };

  const refreshGroups = async () => setGroups((await api.listContactGroups()).map(mapGroup));
  const refreshSenderIds = async () => setSenderIds((await api.listSenderIds()).map(mapSenderId));
  const refreshCampaigns = async () => setCampaigns((await api.listCampaigns()).map(mapCampaign));

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
      authed, authChecked, wallet, fullName, groups, senderIds, campaigns, rate,
      login, signup, logout, refreshWallet, refreshGroups, createGroup, addContact, uploadCsv,
      refreshSenderIds, requestSenderId, refreshCampaigns, createCampaign, fetchCampaign, retryCampaign, verifyPayment,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed, authChecked, wallet, fullName, groups, senderIds, campaigns, rate],
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
  rate: PlatformRate;
  senderIds: SenderId[];
  users: AdminUser[];
  adminCampaigns: Campaign[];
  login: (email: string, password: string) => Promise<Result>;
  logout: () => void;
  refreshSenderIds: () => Promise<void>;
  setDndWhitelisted: (id: number, whitelisted: boolean) => Promise<void>;
  refreshUsers: () => Promise<void>;
  adjustUserBalance: (userId: number, amount: number, direction: 'credit' | 'debit', reason: string) => Promise<Result>;
  setRate: (rate: PlatformRate) => Promise<Result>;
  refreshAdminCampaigns: () => Promise<void>;
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
  const [adminCampaigns, setAdminCampaigns] = useState<Campaign[]>([]);

  const loadAll = async () => {
    const [rateRes, sidRes, usersRes, campaignsRes] = await Promise.allSettled([
      api.adminGetRate(),
      api.adminListSenderIds(),
      api.adminListUsers(),
      api.adminListCampaigns(),
    ]);
    if (rateRes.status === 'fulfilled') setRateState({ genericRate: parseFloat(rateRes.value.generic_rate), dndRate: parseFloat(rateRes.value.dnd_rate) });
    if (sidRes.status === 'fulfilled') setSenderIds(sidRes.value.map(mapSenderId));
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value.map(mapAdminUser));
    if (campaignsRes.status === 'fulfilled') setAdminCampaigns(campaignsRes.value.map(mapCampaign));
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
  };

  const refreshSenderIds = async () => setSenderIds((await api.adminListSenderIds()).map(mapSenderId));
  const refreshUsers = async () => setUsers((await api.adminListUsers()).map(mapAdminUser));
  const refreshAdminCampaigns = async () => setAdminCampaigns((await api.adminListCampaigns()).map(mapCampaign));

  const setDndWhitelisted: AdminStoreValue['setDndWhitelisted'] = async (id, whitelisted) => {
    const updated = mapSenderId(await api.adminSetDndWhitelisted(id, whitelisted));
    setSenderIds((s) => s.map((x) => (x.id === id ? updated : x)));
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
      authed, authChecked, rate, senderIds, users, adminCampaigns,
      login, logout, refreshSenderIds, setDndWhitelisted, refreshUsers, adjustUserBalance, setRate,
      refreshAdminCampaigns, sendCampaign,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authed, authChecked, rate, senderIds, users, adminCampaigns],
  );

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore(): AdminStoreValue {
  const ctx = useContext(AdminStoreContext);
  if (!ctx) throw new Error('useAdminStore must be used within AdminStoreProvider');
  return ctx;
}
