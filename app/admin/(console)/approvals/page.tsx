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
  const { senderIds, setDndWhitelisted, approveSenderId } = useAdminStore();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);

  // The shared, no-approval-needed sender IDs (Sendchamp, SAlert, SC-OTP)
  // come back in this same list so the "Send platform campaign" screen
  // can offer them too, but they aren't real rows — there's no request
  // to review and no id to PATCH a whitelist flag onto, so they don't
  // belong in a table of pending/approved requests.
  const requests = senderIds.filter((s) => !s.isShared);

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

  // For a request Admin has submitted directly on Sendchamp's or
  // KudiSMS's own dashboard and confirmed approved there — neither has a
  // request/status API to sync automatically, so this is how it gets
  // marked usable. Once approved this way it's Sendchamp/KudiSMS's route
  // and DND whitelisting no longer applies to it.
  const approveVia = async (id: number, provider: 'sendchamp' | 'kudisms') => {
    setBusyId(id);
    const result = await approveSenderId(id, provider);
    if (result.ok) {
      toast.success(`Approved via ${provider === 'kudisms' ? 'KudiSMS' : 'Sendchamp'}.`);
    } else {
      toast.error(result.error);
    }
    setBusyId(null);
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-ink">Sender IDs</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Nothing is submitted to any provider automatically — every request below needs you to submit the name on
        Termii's, Sendchamp's, or KudiSMS's own dashboard by hand, using the stated use case, then approve it here
        once that provider confirms it. From that point it's usable only by the customer who requested it.
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-6 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>SENDER ID</span>
          <span>USER</span>
          <span>PROVIDER</span>
          <span>STATUS</span>
          <span>REQUESTED</span>
          <span>ACTION</span>
        </div>
        {requests.length === 0 && <div className="px-4 py-5 text-sm text-muted">No sender ID requests yet.</div>}
        {requests.map((s) => (
          <div key={s.id} className="grid grid-cols-6 items-center border-b border-border px-4 py-3.5 text-sm last:border-b-0">
            <div className="flex flex-col">
              <span className="font-semibold">{s.name}</span>
              {s.useCase && <span className="truncate text-xs text-muted" title={s.useCase}>{s.useCase}</span>}
            </div>
            <span className="text-muted">{s.userEmail ?? '—'}</span>
            <span className="capitalize text-muted">{s.provider}</span>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[s.status]}`}>{s.status}</span>
            <span className="text-muted">{new Date(s.createdAt).toLocaleDateString()}</span>
            {s.provider === 'termii' ? (
              s.status === 'pending' ? (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => approveVia(s.id, 'kudisms')}
                    disabled={busyId === s.id}
                    className="w-fit rounded-md bg-border px-2.5 py-1.5 text-xs font-bold !text-muted disabled:opacity-60"
                  >
                    Approve via KudiSMS
                  </button>
                  <button
                    onClick={() => approveVia(s.id, 'sendchamp')}
                    disabled={busyId === s.id}
                    className="w-fit rounded-md bg-border px-2.5 py-1.5 text-xs font-bold !text-muted disabled:opacity-60"
                  >
                    Approve via Sendchamp
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => toggle(s.id, s.dndWhitelisted)}
                  disabled={busyId === s.id}
                  className={`w-fit rounded-md px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${
                    s.dndWhitelisted ? 'bg-success' : 'bg-border !text-muted'
                  }`}
                >
                  {s.dndWhitelisted ? 'Whitelisted' : 'Mark whitelisted'}
                </button>
              )
            ) : (
              <span className="text-xs text-muted">No DND action needed</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
