'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, NavItem } from '@/components/AppShell';
import { useUserStore } from '@/lib/store';
import { DashboardIcon, ContactsIcon, CampaignIcon, WalletIcon, SenderIdIcon } from '@/components/icons';

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/contacts', label: 'Contacts', icon: ContactsIcon },
  { href: '/campaigns/new', label: 'Campaigns', icon: CampaignIcon },
  { href: '/wallet', label: 'Wallet', icon: WalletIcon },
  { href: '/sender-ids', label: 'Sender IDs', icon: SenderIdIcon },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { authed, wallet, logout } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!authed) router.replace('/login');
  }, [authed, router]);

  if (!authed) return null;

  return (
    <AppShell
      navItems={navItems}
      onLogout={() => {
        logout();
        router.replace('/login');
      }}
      showBalance
      balance={wallet}
      avatarInitials="AO"
      avatarColor="bg-accent"
    >
      {children}
    </AppShell>
  );
}
