'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { SenderIdStatus } from '@/types';

const STATUS_STYLE: Record<SenderIdStatus, string> = {
  active: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  blocked: 'bg-danger/10 text-danger',
};

export default function SenderIdsPage() {
  const { senderIds, requestSenderId } = useUserStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [useCase, setUseCase] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim() || !useCase.trim()) {
      setError('Both the name and a real sample message are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    // Hits Termii's POST /api/sender-id/request (sender_id, use_case,
    // company) on the backend; status then syncs from Termii's GET
    // /api/sender-id (active/pending/blocked), not set by us.
    const result = await requestSenderId(name, useCase);
    setSubmitting(false);
    if (result.ok) {
      setName('');
      setUseCase('');
      toast.success(`${name.toUpperCase()} submitted — Termii typically reviews it within 1-2 business days.`);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink">Sender IDs</h1>
      <div className="grid max-w-3xl grid-cols-2 gap-6">
        <div className="h-fit overflow-hidden rounded-xl border border-border bg-surface">
          <div className="grid grid-cols-2 border-b border-border px-4 py-3 text-xs font-bold text-muted">
            <span>NAME</span>
            <span>STATUS</span>
          </div>
          {senderIds.map((s) => (
            <div key={s.id} className="grid grid-cols-2 items-center border-b border-border px-4 py-3.5 text-sm last:border-b-0">
              <span className="font-semibold">{s.name}</span>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[s.status]}`}>{s.status}</span>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-xl border border-border bg-surface p-6">
          <div className="mb-2 text-xs font-bold text-muted">REQUEST NEW SENDER ID</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={11}
            placeholder="e.g. MYBRAND"
            className="mb-3 w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm text-ink"
          />
          <textarea
            value={useCase}
            onChange={(e) => setUseCase(e.target.value)}
            placeholder="Real sample message this Sender ID will send (Termii requires a real example, no {{placeholders}})"
            className="mb-3 min-h-[80px] w-full rounded-lg border border-border bg-bg p-3 text-sm text-ink"
          />
          <div className="mb-4 text-xs text-muted">Max 11 alphanumeric characters. Reviewed by Termii — not instant.</div>
          {error && <div className="mb-3 rounded-lg bg-danger/10 px-3 py-2.5 text-xs font-semibold text-danger">{error}</div>}
          <button onClick={submit} disabled={submitting} className="w-full rounded-lg bg-accent py-3 text-sm font-bold text-white disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit request'}
          </button>
        </div>
      </div>
    </div>
  );
}
