'use client';

import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { formatNaira } from '@/lib/money';

export default function AdminDashboardPage() {
  const { senderIds, users, adminCampaigns } = useAdminStore();
  const pending = senderIds.filter((s) => s.status === 'pending');
  const totalRevenue = users.reduce((sum, u) => sum + u.balance, 0);
  const totalSms = adminCampaigns.reduce((sum, c) => sum + c.recipients, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink">Platform overview</h1>
      <div className="mb-7 grid grid-cols-3 gap-4">
        <Stat label="Total users" value={String(users.length)} />
        <Stat label="Admin SMS sent" value={totalSms.toLocaleString()} />
        <Stat label="Total user balances" value={formatNaira(totalRevenue)} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">Pending sender ID requests</h3>
        <Link href="/admin/approvals" className="text-sm font-bold text-accent">
          Review all &rarr;
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {pending.length === 0 && <div className="px-4 py-5 text-sm text-muted">Nothing pending.</div>}
        {pending.map((p) => (
          <div key={p.id} className="flex justify-between border-b border-border px-4 py-3.5 text-sm last:border-b-0">
            <span>
              <b>{p.name}</b> requested by {p.userEmail ?? 'unknown'}
            </span>
            <span className="text-muted">{new Date(p.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 text-sm font-semibold text-muted">{label}</div>
      <div className="text-2xl font-extrabold text-ink">{value}</div>
    </div>
  );
}
