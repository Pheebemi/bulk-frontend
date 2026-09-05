export type SenderIdStatus = 'active' | 'pending' | 'blocked';

export interface SenderId {
  id: number;
  name: string;
  status: SenderIdStatus;
  dndWhitelisted: boolean;
  createdAt: string;
  userEmail?: string;
  /** True for the shared, no-approval-needed sender IDs (see backend
   *  DEFAULT_SENDER_IDS) — synthetic entries, not the caller's own. */
  isShared: boolean;
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
  provider: 'termii' | 'sendchamp';
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
