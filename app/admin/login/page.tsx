'use client';

import { useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/store';

export default function AdminLoginPage() {
  const { login } = useAdminStore();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    router.push('/admin/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <div className="w-[380px] rounded-2xl bg-surface p-9">
        <div className="mb-7 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v12H7l-3 3V4z" />
            </svg>
          </div>
          <span className="font-display text-xl font-extrabold text-ink">Reachly Admin</span>
        </div>
        <h1 className="mb-1 text-xl font-extrabold text-ink">Admin console</h1>
        <p className="mb-6 text-sm text-muted">Restricted to platform staff.</p>
        <form onSubmit={submit}>
          <label className="mb-1.5 block text-xs font-bold text-muted">EMAIL</label>
          <input type="email" required className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink" placeholder="admin@reachly.com" />
          <label className="mb-1.5 block text-xs font-bold text-muted">PASSWORD</label>
          <input type="password" required className="mb-6 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink" placeholder="••••••••" />
          <button type="submit" className="w-full rounded-lg bg-purple-600 py-3.5 text-sm font-bold text-white">
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
