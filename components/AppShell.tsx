'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { LogoMark, LogoutIcon, SunIcon, MoonIcon } from '@/components/icons';
import { useTheme } from '@/lib/theme';
import { formatNaira } from '@/lib/money';

export interface NavItem {
  href: string;
  label: string;
  icon: (p: { className?: string; color?: string }) => JSX.Element;
  badgeCount?: number;
}

interface AppShellProps {
  brandLabel?: string;
  navItems: NavItem[];
  onLogout: () => void;
  showBalance?: boolean;
  balance?: number;
  avatarInitials: string;
  avatarColor?: string;
  children: ReactNode;
}

export function AppShell({
  brandLabel,
  navItems,
  onLogout,
  showBalance,
  balance = 0,
  avatarInitials,
  avatarColor = 'bg-accent',
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();

  return (
    <div className="flex min-h-screen w-full bg-bg text-ink">
      <aside className="flex w-[232px] flex-none flex-col gap-1 bg-sidebar px-4 py-6">
        <div className="flex items-center gap-2.5 px-2 pb-2">
          <LogoMark />
          <span className="font-display text-lg font-extrabold text-white">Reachly</span>
        </div>
        {brandLabel && <div className="px-2 pb-5 text-[11px] font-bold tracking-wide text-slate-400">{brandLabel}</div>}

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  active ? 'bg-accent text-white' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon color={active ? '#ffffff' : '#c7d2e6'} />
                <span>{item.label}</span>
                {!!item.badgeCount && (
                  <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold text-white">
                    {item.badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />
        <button
          onClick={toggle}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-400 hover:bg-white/5"
        >
          {dark ? <SunIcon color="#93a1b8" /> : <MoonIcon color="#93a1b8" />}
          <span>Toggle theme</span>
        </button>
        <button onClick={onLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-400 hover:bg-white/5">
          <LogoutIcon color="#93a1b8" />
          <span>Log out</span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-4 border-b border-border px-8 py-4">
          {showBalance && (
            <div className="flex items-center gap-2 rounded-full bg-accentSoft px-3.5 py-2">
              <span className="text-xs font-semibold text-muted">Balance</span>
              <span className="text-sm font-extrabold text-accent">{formatNaira(balance)}</span>
            </div>
          )}
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}>
            {avatarInitials}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-8">{children}</div>
      </div>
    </div>
  );
}
