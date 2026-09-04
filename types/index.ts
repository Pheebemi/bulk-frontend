export type SenderIdStatus = 'active' | 'pending' | 'blocked';

export interface SenderId {
  id: string;
  name: string;
  status: SenderIdStatus;
  dndWhitelisted: boolean;
  createdAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  contacts: Contact[];
}

export type CampaignStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED';
export type CampaignChannel = 'generic' | 'dnd';

export interface Campaign {
  id: string;
  name: string;
  channel: CampaignChannel;
  senderId: string;
  message: string;
  recipients: number;
  cost: number; // platform rate charged to the user (0 for admin campaigns)
  termiiCost: number; // what Termii actually charged (reference / margin tracking)
  delivered: number;
  failed: number;
  status: CampaignStatus;
  isAdminCampaign: boolean;
  createdAt: string;
}

export interface WalletTx {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = credit, negative = debit
}

export interface PlatformRate {
  genericRate: number;
  dndRate: number;
}
