'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoMark } from '@/components/icons';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/lib/toast';

export default function LoginPage() {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup: doSignup } = useUserStore();
  const toast = useToast();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = signup ? await doSignup(email, password, fullName, phone) : await login(email, password);
    setSubmitting(false);
    if (result.ok) {
      if (signup) toast.success(`Welcome to Reachly, ${fullName || 'there'}.`);
      router.push('/dashboard');
    } else {
      setError(result.error);
    }
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
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink"
                placeholder="Ada Obi"
              />
              <label className="mb-1.5 block text-xs font-bold text-muted">PHONE NUMBER</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="2348012345678"
                className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink"
              />
            </>
          )}
          <label className="mb-1.5 block text-xs font-bold text-muted">EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink"
            placeholder="you@company.com"
          />
          <label className="mb-1.5 block text-xs font-bold text-muted">PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mb-6 w-full rounded-lg border border-border bg-bg px-3.5 py-3 text-sm text-ink"
            placeholder="••••••••"
          />

          {error && <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-3 text-xs font-semibold text-danger">{error}</div>}

          <button type="submit" disabled={submitting} className="mb-4 w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60">
            {submitting ? 'Please wait...' : signup ? 'Create account' : 'Log in'}
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
