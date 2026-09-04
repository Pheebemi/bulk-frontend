'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import type {
  Campaign,
  CampaignChannel,
  Contact,
  ContactGroup,
  PlatformRate,
  SenderId,
} from '@/types';
import { countSegments } from '@/lib/money';

/**
 * Mock, localStorage-backed app state for both the user app and the admin
 * console. There is no backend yet (bulk-backend is next) — every action
 * here mutates local state directly instead of calling lib/api.ts. When the
 * backend exists, swap each action's body for the matching api.* call and
 * keep the same function signatures so pages don't need to change.
 */

function useLocalStorageState<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [key, state, hydrated]);

  return [state, setState];
}

let idCounter = 1;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}`;
}

// ---------------------------------------------------------------------------
// User store
// ---------------------------------------------------------------------------

interface UserState {
  authed: boolean;
  wallet: number;
  groups: ContactGroup[];
  senderIds: SenderId[];
  campaigns: Campaign[];
}

const DEFAULT_RATE: PlatformRate = { genericRate: 8, dndRate: 10 };

const initialUserState: UserState = {
  authed: false,
  wallet: 0,
  groups: [
    {
      id: 'grp_1',
      name: 'VIP Customers',
      contacts: [
        { id: 'c1', firstName: 'Ada', lastName: 'Obi', phone: '2348012345678' },
        { id: 'c2', firstName: 'Chidi', lastName: 'Eze', phone: '2348023456789' },
      ],
    },
    {
      id: 'grp_2',
      name: 'Newsletter List',
      contacts: [
        { id: 'c3', firstName: 'Tunde', lastName: 'Bello', phone: '2348045678901' },
        { id: 'c4', firstName: 'Grace', lastName: 'Yusuf', phone: '2348056789012' },
      ],
    },
  ],
  senderIds: [
    { id: 'sid_0', name: 'Termii', status: 'active', dndWhitelisted: false, createdAt: new Date().toISOString() },
    { id: 'sid_1', name: 'PHEEDEV', status: 'pending', dndWhitelisted: false, createdAt: new Date().toISOString() },
  ],
  campaigns: [],
};

interface UserStoreValue extends UserState {
  login: () => void;
  logout: () => void;
  fundWallet: (amount: number) => void;
  addGroup: (name: string) => ContactGroup;
  addContact: (groupId: string, contact: Omit<Contact, 'id'>) => void;
  requestSenderId: (name: string) => void;
  createCampaign: (args: {
    senderId: string;
    channel: CampaignChannel;
    message: string;
    groupId?: string;
    manualNumbers?: string[];
  }) => { ok: true; campaign: Campaign } | { ok: false; error: string };
  retryCampaign: (id: string) => void;
  rate: PlatformRate;
}

const UserStoreContext = createContext<UserStoreValue | null>(null);

export function UserStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorageState<UserState>('reachly_user_store', initialUserState);
  const rate = DEFAULT_RATE; // TODO: fetch from backend PlatformRate once it exists

  const login = () => setState((s) => ({ ...s, authed: true }));
  const logout = () => setState((s) => ({ ...s, authed: false }));

  const fundWallet = (amount: number) => setState((s) => ({ ...s, wallet: s.wallet + amount }));

  const addGroup = (name: string): ContactGroup => {
    const group: ContactGroup = { id: nextId('grp'), name, contacts: [] };
    setState((s) => ({ ...s, groups: [...s.groups, group] }));
    return group;
  };

  const addContact = (groupId: string, contact: Omit<Contact, 'id'>) => {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === groupId ? { ...g, contacts: [...g.contacts, { ...contact, id: nextId('c') }] } : g,
      ),
    }));
  };

  const requestSenderId = (name: string) => {
    setState((s) => ({
      ...s,
      senderIds: [
        ...s.senderIds,
        { id: nextId('sid'), name: name.toUpperCase(), status: 'pending', dndWhitelisted: false, createdAt: new Date().toISOString() },
      ],
    }));
  };

  const createCampaign: UserStoreValue['createCampaign'] = ({ senderId, channel, message, groupId, manualNumbers }) => {
    const group = groupId ? state.groups.find((g) => g.id === groupId) : undefined;
    const recipients = group ? group.contacts.length : (manualNumbers ?? []).length;
    if (recipients === 0) return { ok: false, error: 'No recipients selected.' };

    const segments = countSegments(message);
    const rateForChannel = channel === 'dnd' ? rate.dndRate : rate.genericRate;
    const cost = recipients * segments * rateForChannel;
    if (cost > state.wallet) return { ok: false, error: 'Insufficient wallet balance.' };

    const failed = Math.max(0, Math.round(recipients * 0.03));
    const delivered = recipients - failed;
    const campaign: Campaign = {
      id: nextId('camp'),
      name: message.slice(0, 32) || 'Untitled campaign',
      channel,
      senderId,
      message,
      recipients,
      cost,
      termiiCost: recipients * segments * 6, // reference: Termii's own generic-route cost per their docs example
      delivered,
      failed,
      status: failed > 0 && delivered === 0 ? 'FAILED' : 'DELIVERED',
      isAdminCampaign: false,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, wallet: s.wallet - cost, campaigns: [campaign, ...s.campaigns] }));
    return { ok: true, campaign };
  };

  const retryCampaign = (id: string) => {
    setState((s) => ({
      ...s,
      campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, status: 'DELIVERED', failed: 0, delivered: c.recipients } : c)),
    }));
  };

  const value = useMemo<UserStoreValue>(
    () => ({ ...state, login, logout, fundWallet, addGroup, addContact, requestSenderId, createCampaign, retryCampaign, rate }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
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

interface PendingSenderId {
  id: string;
  name: string;
  user: string;
  date: string;
}

interface ProcessedSenderId extends PendingSenderId {
  status: 'Approved' | 'Rejected';
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  history: { id: string; date: string; description: string; amount: number }[];
}

interface AdminState {
  authed: boolean;
  rate: PlatformRate;
  pending: PendingSenderId[];
  processed: ProcessedSenderId[];
  users: AdminUser[];
  adminCampaigns: Campaign[];
}

const initialAdminState: AdminState = {
  authed: false,
  rate: DEFAULT_RATE,
  pending: [
    { id: 'p1', name: 'ADASTORE', user: 'Ada Obi', date: 'Sep 3, 2026' },
    { id: 'p2', name: 'TBFASHION', user: 'Tunde Bello', date: 'Sep 2, 2026' },
  ],
  processed: [],
  users: [
    { id: 'u1', name: 'Ada Obi', email: 'ada@obi.com', balance: 45230, history: [] },
    { id: 'u2', name: 'Tunde Bello', email: 'tunde@bello.com', balance: 12400, history: [] },
  ],
  adminCampaigns: [],
};

interface AdminStoreValue extends AdminState {
  login: () => void;
  logout: () => void;
  approve: (id: string) => void;
  reject: (id: string) => void;
  adjustUserBalance: (userId: string, amount: number, reason: string) => void;
  setRate: (rate: PlatformRate) => void;
  sendCampaign: (args: { senderId: string; channel: CampaignChannel; message: string; recipients: number }) => Campaign;
}

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorageState<AdminState>('reachly_admin_store', initialAdminState);

  const login = () => setState((s) => ({ ...s, authed: true }));
  const logout = () => setState((s) => ({ ...s, authed: false }));

  const approve = (id: string) => {
    setState((s) => {
      const item = s.pending.find((p) => p.id === id);
      if (!item) return s;
      return {
        ...s,
        pending: s.pending.filter((p) => p.id !== id),
        processed: [{ ...item, status: 'Approved' }, ...s.processed],
      };
    });
  };

  const reject = (id: string) => {
    setState((s) => {
      const item = s.pending.find((p) => p.id === id);
      if (!item) return s;
      return {
        ...s,
        pending: s.pending.filter((p) => p.id !== id),
        processed: [{ ...item, status: 'Rejected' }, ...s.processed],
      };
    });
  };

  const adjustUserBalance = (userId: string, amount: number, reason: string) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              balance: u.balance + amount,
              history: [{ id: nextId('h'), date: new Date().toISOString(), description: reason, amount }, ...u.history],
            }
          : u,
      ),
    }));
  };

  const setRate = (rate: PlatformRate) => setState((s) => ({ ...s, rate }));

  const sendCampaign: AdminStoreValue['sendCampaign'] = ({ senderId, channel, message, recipients }) => {
    const segments = countSegments(message);
    const termiiRatePerUnit = channel === 'dnd' ? 8 : 6; // reference cost only — admin sends aren't charged
    const campaign: Campaign = {
      id: nextId('camp'),
      name: message.slice(0, 32) || 'Admin campaign',
      channel,
      senderId,
      message,
      recipients,
      cost: 0,
      termiiCost: recipients * segments * termiiRatePerUnit,
      delivered: recipients,
      failed: 0,
      status: 'DELIVERED',
      isAdminCampaign: true,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, adminCampaigns: [campaign, ...s.adminCampaigns] }));
    return campaign;
  };

  const value = useMemo<AdminStoreValue>(
    () => ({ ...state, login, logout, approve, reject, adjustUserBalance, setRate, sendCampaign }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state],
  );

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}

export function useAdminStore(): AdminStoreValue {
  const ctx = useContext(AdminStoreContext);
  if (!ctx) throw new Error('useAdminStore must be used within AdminStoreProvider');
  return ctx;
}
