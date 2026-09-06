'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { formatNaira } from '@/lib/money';

export default function DashboardPage() {
  const { wallet, campaigns, campaignsHasMore, campaignsSentTotal, recipientsReachedTotal, loadMoreCampaigns } = useUserStore();
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMoreCampaigns();
    setLoadingMore(false);
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Welcome back</h1>
      <p className="mb-6 text-sm text-muted">Here's how your campaigns are performing.</p>

      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Wallet balance" value={formatNaira(wallet)} />
        <StatCard label="Campaigns sent" value={campaignsSentTotal.toLocaleString()} />
        <StatCard label="Recipients reached" value={recipientsReachedTotal.toLocaleString()} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-ink">Recent campaigns</h3>
        <Link href="/campaigns/new" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white">
          New campaign
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-5 border-b border-border px-4 py-3 text-xs font-bold text-muted">
              <span>CAMPAIGN</span>
              <span>RECIPIENTS</span>
              <span>COST</span>
              <span>DATE</span>
              <span />
            </div>
            {campaigns.length === 0 && <div className="px-4 py-6 text-sm text-muted">No campaigns yet — create your first one.</div>}
            {campaigns.map((c) => (
              <div key={c.id} className="grid grid-cols-5 items-center border-b border-border px-4 py-3.5 text-sm last:border-b-0">
                <span className="font-semibold">{c.name}</span>
                <span className="text-muted">{c.recipients.toLocaleString()}</span>
                <span className="text-muted">{formatNaira(c.cost)}</span>
                <span className="text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                <Link href={`/campaigns/${c.id}`} className="font-bold text-accent">
                  View report
                </Link>
              </div>
            ))}
          </div>
        </div>
        {campaignsHasMore && (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full px-4 py-3 text-center text-sm font-bold text-accent disabled:opacity-60"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 text-sm font-semibold text-muted">{label}</div>
      <div className="text-2xl font-extrabold text-ink">{value}</div>
    </div>
  );
}
