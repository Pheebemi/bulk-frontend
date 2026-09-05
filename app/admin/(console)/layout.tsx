'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, NavItem } from '@/components/AppShell';
import { useAdminStore } from '@/lib/store';
import { DashboardIcon, SenderIdIcon, WalletIcon, CampaignIcon } from '@/components/icons';

export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const { authed, authChecked, senderIds, allCampaigns, refreshAllCampaigns, logout } = useAdminStore();
  const router = useRouter();

  useEffect(() => {
    if (authChecked && !authed) router.replace('/admin/login');
  }, [authed, authChecked, router]);

  // Loaded here (not just on the Campaigns page itself) so the failed-
  // campaign count in the nav badge is accurate as soon as an admin logs
  // in, not only after they happen to visit that page first.
  useEffect(() => {
    if (authed) refreshAllCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  if (!authChecked) return null;
  if (!authed) return null;

  const pendingCount = senderIds.filter((s) => s.status === 'pending' && !s.isShared).length;
  const failedCampaignCount = allCampaigns.filter((c) => c.status === 'FAILED' || c.status === 'PARTIAL').length;

  const navItems: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { href: '/admin/approvals', label: 'Sender ID approvals', icon: SenderIdIcon, badgeCount: pendingCount },
    { href: '/admin/campaigns', label: 'Campaigns', icon: CampaignIcon, badgeCount: failedCampaignCount },
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
