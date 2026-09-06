'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { formatNaira } from '@/lib/money';

export default function AdminAnalyticsPage() {
  const { analytics, userSpend, userSpendHasMore, userSpendTotal, refreshAnalytics, refreshUserSpend, loadMoreUserSpend } = useAdminStore();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    refreshAnalytics();
    refreshUserSpend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMoreUserSpend();
    setLoadingMore(false);
  };

  const totalSpend = analytics.adminSpend + analytics.userSpend;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Analytics</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Admin sends aren&apos;t charged to any wallet — this is Termii&apos;s real cost, tracked for reporting. Customer
        spend is what wallets have actually paid.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Admin spend (tracked, no wallet)" value={formatNaira(analytics.adminSpend)} sub={`${analytics.adminRecipients.toLocaleString()} recipients`} />
        <Stat label="Customer spend (from wallets)" value={formatNaira(analytics.userSpend)} sub={`${analytics.userRecipients.toLocaleString()} recipients`} />
        <Stat label="Total platform spend" value={formatNaira(totalSpend)} sub={`${(analytics.adminRecipients + analytics.userRecipients).toLocaleString()} recipients`} />
      </div>

      <h3 className="mb-3 text-base font-bold text-ink">Spend distribution per user</h3>
      <p className="mb-3 text-xs text-muted">
        Showing {userSpend.length} of {userSpendTotal.toLocaleString()}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-4 border-b border-border px-4 py-3 text-xs font-bold text-muted">
            <span>USER</span>
            <span>CAMPAIGNS</span>
            <span>RECIPIENTS</span>
            <span>SPEND</span>
          </div>
          {userSpend.length === 0 && <div className="px-4 py-5 text-sm text-muted">No customer spend yet.</div>}
          {userSpend.map((u) => (
            <div key={u.id} className="grid grid-cols-4 items-center border-b border-border px-4 py-3.5 text-sm last:border-b-0">
              <span>
                <div className="font-semibold">{u.name}</div>
                <div className="text-xs text-muted">{u.email}</div>
              </span>
              <span className="text-muted">{u.campaignsCount.toLocaleString()}</span>
              <span className="text-muted">{u.recipientsTotal.toLocaleString()}</span>
              <span className="font-bold text-ink">{formatNaira(u.totalSpent)}</span>
            </div>
          ))}
          {userSpendHasMore && (
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

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 text-sm font-semibold text-muted">{label}</div>
      <div className="text-2xl font-extrabold text-ink">{value}</div>
      <div className="mt-1 text-xs text-muted">{sub}</div>
    </div>
  );
}
