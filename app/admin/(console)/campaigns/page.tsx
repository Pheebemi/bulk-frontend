'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { formatNaira } from '@/lib/money';
import type { CampaignStatus } from '@/types';

const STATUS_STYLE: Record<CampaignStatus, string> = {
  PENDING: 'bg-warning/10 text-warning',
  PROCESSING: 'bg-warning/10 text-warning',
  DELIVERED: 'bg-success/10 text-success',
  PARTIAL: 'bg-warning/10 text-warning',
  FAILED: 'bg-danger/10 text-danger',
};

type Filter = 'all' | 'failed';

export default function AdminCampaignsPage() {
  const { allCampaigns, allCampaignsHasMore, allCampaignsTotal, refreshAllCampaigns, loadMoreAllCampaigns } = useAdminStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Done server-side now that the list is paginated — filtering a
    // fetched page client-side would silently miss every match not on
    // whichever page happened to be loaded.
    refreshAllCampaigns(filter === 'failed' ? 'failed' : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMoreAllCampaigns();
    setLoadingMore(false);
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-ink">Campaigns</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Every campaign sent on the platform, customer and admin sends alike. A failed or partially delivered one
        that shows a reason below usually means the sending provider itself — not the customer&apos;s wallet — is
        out of balance and needs topping up.
      </p>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${filter === 'all' ? 'bg-accentSoft text-accent' : ''}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${filter === 'failed' ? 'bg-accentSoft text-accent' : ''}`}
        >
          Failed / partial
        </button>
      </div>

      <p className="mb-3 text-xs text-muted">
        Showing {allCampaigns.length} of {allCampaignsTotal.toLocaleString()}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="min-w-[820px]">
        <div className="grid grid-cols-7 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>USER</span>
          <span>SENDER ID</span>
          <span>PROVIDER</span>
          <span>RECIPIENTS</span>
          <span>COST</span>
          <span>STATUS</span>
          <span>DATE</span>
        </div>
        {allCampaigns.length === 0 && (
          <div className="px-4 py-5 text-sm text-muted">
            {filter === 'failed' ? 'No failed or partial campaigns.' : 'No campaigns sent yet.'}
          </div>
        )}
        {allCampaigns.map((c) => {
          const isProblem = (c.status === 'FAILED' || c.status === 'PARTIAL') && !!c.providerError;
          const isOpen = expandedId === c.id;
          return (
            <div key={c.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => isProblem && setExpandedId(isOpen ? null : c.id)}
                className={`grid w-full grid-cols-7 items-center px-4 py-3.5 text-left text-sm ${isProblem ? '' : 'cursor-default'}`}
              >
                <span className="truncate text-muted">{c.isAdminCampaign ? 'Platform' : c.userEmail}</span>
                <span className="font-semibold">{c.senderId}</span>
                <span className="capitalize text-muted">{c.provider}</span>
                <span className="text-muted">{c.recipients.toLocaleString()}</span>
                <span className="text-muted">{formatNaira(c.cost)}</span>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[c.status]}`}>
                  {c.status.toLowerCase()}
                </span>
                <span className="text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
              </button>
              {isOpen && (
                <div className="border-t border-border bg-danger/5 px-4 py-3">
                  <div className="mb-1 text-xs font-bold text-muted">PROVIDER ERROR</div>
                  <div className="font-mono text-xs text-danger">{c.providerError}</div>
                </div>
              )}
            </div>
          );
        })}
        {allCampaignsHasMore && (
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
    </div>
  );
}
