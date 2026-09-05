export type SenderIdStatus = 'active' | 'pending' | 'blocked';

export type SmsProvider = 'termii' | 'sendchamp' | 'kudisms';

export type SenderIdVisibility = 'private' | 'shared' | 'admin_only';

export interface SenderId {
  id: number;
  name: string;
  /** Admin-only — absent for the customer's own view of their requests. */
  useCase?: string;
  /** Admin-only — absent from the customer-facing list (which only ever
   *  contains their own private rows plus every shared one anyway). */
  visibility?: SenderIdVisibility;
  provider: SmsProvider;
  status: SenderIdStatus;
  dndWhitelisted: boolean;
  createdAt: string;
  userEmail?: string;
  /** True when visibility === 'shared' — every customer can send from it. */
  isShared: boolean;
  /** True when visibility === 'admin_only' — only the admin console's own
   *  sends can use it; never present in the customer-facing list at all. */
  isAdminOnly?: boolean;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ContactGroup {
  id: number;
  name: string;
  contacts: Contact[];
  contactCount: number;
}

export type CampaignStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'PARTIAL' | 'FAILED';
export type CampaignChannel = 'generic' | 'dnd';

export interface Campaign {
  id: number;
  name: string;
  channel: CampaignChannel;
  senderId: string;
  message: string;
  recipients: number;
  cost: number;
  termiiCost: number;
  delivered: number;
  failed: number;
  status: CampaignStatus;
  isAdminCampaign: boolean;
  provider: SmsProvider;
  createdAt: string;
}

/** Admin-only view of a campaign — who it belongs to, and the real
 *  reason on a failed/partial send. Never returned to the customer. */
export interface AdminCampaign extends Campaign {
  userEmail: string;
  providerError: string;
}

export interface WalletHistoryEntry {
  id: number;
  description: string;
  amount: number;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  balance: number;
  history: WalletHistoryEntry[];
}

export interface PlatformRate {
  genericRate: number;
  dndRate: number;
}
