'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { SenderIdStatus } from '@/types';

const STATUS_STYLE: Record<SenderIdStatus, string> = {
  active: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  blocked: 'bg-danger/10 text-danger',
};

export default function ApprovalsPage() {
  const { senderIds, setDndWhitelisted } = useAdminStore();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);

  const toggle = async (id: number, current: boolean) => {
    setBusyId(id);
    try {
      await setDndWhitelisted(id, !current);
      toast.success(current ? 'DND whitelisting removed.' : 'Marked as DND whitelisted.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update DND whitelisting.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-ink">Sender IDs</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Status here is synced directly from Termii's own review team (<code>active</code> / <code>pending</code> /{' '}
        <code>blocked</code>) — we don't decide it. The one thing we do control is confirming DND whitelisting once
        Termii's support has told you it's done for a given Sender ID.
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-5 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>SENDER ID</span>
          <span>USER</span>
          <span>STATUS</span>
          <span>REQUESTED</span>
          <span>DND WHITELISTED</span>
        </div>
        {senderIds.length === 0 && <div className="px-4 py-5 text-sm text-muted">No sender ID requests yet.</div>}
        {senderIds.map((s) => (
          <div key={s.id} className="grid grid-cols-5 items-center border-b border-border px-4 py-3.5 text-sm last:border-b-0">
            <span className="font-semibold">{s.name}</span>
            <span className="text-muted">{s.userEmail ?? '—'}</span>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[s.status]}`}>{s.status}</span>
            <span className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</span>
            <button
              onClick={() => toggle(s.id, s.dndWhitelisted)}
              disabled={busyId === s.id}
              className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${
                s.dndWhitelisted ? 'bg-success' : 'bg-border !text-muted'
              }`}
            >
              {s.dndWhitelisted ? 'Whitelisted' : 'Mark whitelisted'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
