export type SenderIdStatus = 'active' | 'pending' | 'blocked';

export interface SenderId {
  id: number;
  name: string;
  status: SenderIdStatus;
  dndWhitelisted: boolean;
  createdAt: string;
  userEmail?: string;
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

export type CampaignStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED';
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
  createdAt: string;
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
