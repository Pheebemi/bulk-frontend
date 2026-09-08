'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { LogoMark, LogoutIcon, SunIcon, MoonIcon, MenuIcon, CloseIcon } from '@/components/icons';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer automatically on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-2 pb-2">
        <LogoMark />
        <span className="font-display text-lg font-extrabold text-white">Reachly</span>
        <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 md:hidden" aria-label="Close menu">
          <CloseIcon color="#c7d2e6" />
        </button>
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
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-ink">
      {/* Desktop sidebar — fixed to the viewport height regardless of how
          long the current page's content is, so Toggle theme/Log out
          never end up below the fold; its own nav list scrolls
          independently if it's ever taller than the viewport. */}
      <aside className="hidden h-full w-[232px] flex-none flex-col gap-1 overflow-y-auto bg-sidebar px-4 py-6 md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile off-canvas sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[260px] flex-col gap-1 overflow-y-auto bg-sidebar px-4 py-6">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:justify-end sm:gap-4 sm:px-8 sm:py-4">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 hover:bg-surface2 sm:mr-auto md:hidden" aria-label="Open menu">
            <MenuIcon color="currentColor" />
          </button>
          {showBalance && (
            <div className="flex items-center gap-1.5 rounded-full bg-accentSoft px-2.5 py-1.5 sm:gap-2 sm:px-3.5 sm:py-2">
              <span className="hidden text-xs font-semibold text-muted sm:inline">Balance</span>
              <span className="text-xs font-extrabold text-accent sm:text-sm">{formatNaira(balance)}</span>
            </div>
          )}
          <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold text-white sm:h-9 sm:w-9 sm:text-sm ${avatarColor}`}>
            {avatarInitials}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
