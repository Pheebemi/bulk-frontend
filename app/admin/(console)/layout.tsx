'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, NavItem } from '@/components/AppShell';
import { useAdminStore } from '@/lib/store';
import { DashboardIcon, SenderIdIcon, WalletIcon, CampaignIcon } from '@/components/icons';

export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const { authed, pending, logout } = useAdminStore();
  const router = useRouter();

  useEffect(() => {
    if (!authed) router.replace('/admin/login');
  }, [authed, router]);

  if (!authed) return null;

  const navItems: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/admin/approvals', label: 'Sender ID approvals', icon: SenderIdIcon, badgeCount: pending.length },
    { href: '/admin/wallets', label: 'User wallets', icon: WalletIcon },
    { href: '/admin/send', label: 'Send campaign', icon: CampaignIcon },
  ];

  return (
    <AppShell
      brandLabel="ADMIN CONSOLE"
      navItems={navItems}
      onLogout={() => {
        logout();
        router.replace('/admin/login');
      }}
      avatarInitials="SU"
      avatarColor="bg-purple-600"
    >
      {children}
    </AppShell>
  );
}
