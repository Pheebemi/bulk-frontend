'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { formatNaira } from '@/lib/money';

// TODO: once bulk-backend exists, this page should poll
// GET /api/campaigns/{id}/ (which itself proxies Termii's Fetch Campaign
// History endpoint) every few seconds while status is PENDING/PROCESSING,
// instead of reading a status that's already final from local mock state.

export default function CampaignReportPage() {
  const { id } = useParams<{ id: string }>();
  const { campaigns, retryCampaign } = useUserStore();
  const campaign = campaigns.find((c) => c.id === id);

  useEffect(() => {
    // placeholder for future polling effect
  }, [id]);

  if (!campaign) {
    return (
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-muted">
          &larr; Back to dashboard
        </Link>
        <p className="mt-4 text-sm text-muted">Campaign not found.</p>
      </div>
    );
  }

  const statusColor =
    campaign.status === 'DELIVERED' ? 'text-success' : campaign.status === 'FAILED' ? 'text-danger' : 'text-warning';

  return (
    <div>
      <Link href="/dashboard" className="text-sm font-semibold text-muted">
        &larr; Back to dashboard
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-extrabold text-ink">{campaign.name}</h1>

      <div className="mb-7 grid grid-cols-4 gap-4">
        <MiniStat label="RECIPIENTS" value={String(campaign.recipients)} />
        <MiniStat label="DELIVERED" value={String(campaign.delivered)} valueClass="text-success" />
        <MiniStat label="FAILED" value={String(campaign.failed)} valueClass="text-danger" />
        <MiniStat label="COST" value={formatNaira(campaign.cost)} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className={`text-sm font-bold ${statusColor}`}>Status: {campaign.status}</span>
        {campaign.status === 'FAILED' && (
          <button onClick={() => retryCampaign(campaign.id)} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white">
            Retry campaign
          </button>
        )}
      </div>

      <h3 className="mb-3 text-base font-bold text-ink">Recipient log</h3>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-2 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>RECIPIENT</span>
          <span>STATUS</span>
        </div>
        {Array.from({ length: Math.min(campaign.delivered, 3) }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 items-center border-b border-border px-4 py-3 text-sm last:border-b-0">
            <span>2348{(10000000 + i * 7).toString().slice(0, 8)}</span>
            <span className="w-fit rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">Delivered</span>
          </div>
        ))}
        {campaign.failed > 0 && (
          <div className="grid grid-cols-2 items-center px-4 py-3 text-sm">
            <span>2348099999901</span>
            <span className="w-fit rounded-full bg-danger/10 px-2.5 py-1 text-xs font-bold text-danger">Failed</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, valueClass = 'text-ink' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1.5 text-xs font-semibold text-muted">{label}</div>
      <div className={`text-xl font-extrabold ${valueClass}`}>{value}</div>
    </div>
  );
}
