'use client';

import { useAdminStore } from '@/lib/store';

export default function ApprovalsPage() {
  const { pending, processed, approve, reject } = useAdminStore();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink">Sender ID approvals</h1>

      <h3 className="mb-2.5 text-sm font-bold text-muted">PENDING ({pending.length})</h3>
      <div className="mb-7 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-4 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>SENDER ID</span>
          <span>USER</span>
          <span>DATE</span>
          <span>ACTION</span>
        </div>
        {pending.length === 0 && <div className="px-4 py-5 text-sm text-muted">Nothing pending.</div>}
        {pending.map((p) => (
          <div key={p.id} className="grid grid-cols-4 items-center border-b border-border px-4 py-3.5 text-sm last:border-b-0">
            <span className="font-semibold">{p.name}</span>
            <span className="text-muted">{p.user}</span>
            <span className="text-muted">{p.date}</span>
            <span className="flex gap-2">
              <button onClick={() => approve(p.id)} className="rounded-md bg-success px-3 py-1.5 text-xs font-bold text-white">
                Approve
              </button>
              <button onClick={() => reject(p.id)} className="rounded-md bg-danger px-3 py-1.5 text-xs font-bold text-white">
                Reject
              </button>
            </span>
          </div>
        ))}
      </div>

      <h3 className="mb-2.5 text-sm font-bold text-muted">RECENTLY PROCESSED</h3>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {processed.length === 0 && <div className="px-4 py-5 text-sm text-muted">Nothing processed yet.</div>}
        {processed.map((p) => (
          <div key={p.id} className="flex items-center justify-between border-b border-border px-4 py-3.5 text-sm last:border-b-0">
            <span>
              {p.name} — {p.user}
            </span>
            <span
              className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${
                p.status === 'Approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
