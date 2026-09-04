'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoMark } from '@/components/icons';
import { useUserStore } from '@/lib/store';

export default function LoginPage() {
  const [signup, setSignup] = useState(false);
  const { login } = useUserStore();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: swap for api.login()/api.signup() once bulk-backend exists.
    login();
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <div className="w-[380px] rounded-2xl bg-surface p-9">
        <div className="mb-7 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-xl font-extrabold text-ink">Reachly</span>
        </div>
        <h1 className="mb-1 text-xl font-extrabold text-ink">{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mb-6 text-sm text-muted">{signup ? 'Start sending bulk SMS in minutes.' : 'Log in to your Reachly dashboard.'}</p>

        <form onSubmit={submit}>
          {signup && (
            <>
              <label className="mb-1.5 block text-xs font-bold text-muted">FULL NAME</label>
              <input className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink" placeholder="Ada Obi" />
            </>
          )}
          <label className="mb-1.5 block text-xs font-bold text-muted">EMAIL</label>
          <input type="email" required className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink" placeholder="you@company.com" />
          <label className="mb-1.5 block text-xs font-bold text-muted">PASSWORD</label>
          <input type="password" required className="mb-6 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink" placeholder="••••••••" />

          <button type="submit" className="mb-4 w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white">
            {signup ? 'Create account' : 'Log in'}
          </button>
        </form>
        <div className="text-center text-sm text-muted">
          <span>{signup ? 'Already have an account?' : "Don't have an account?"} </span>
          <button onClick={() => setSignup((v) => !v)} className="font-bold text-accent">
            {signup ? 'Log in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
}
