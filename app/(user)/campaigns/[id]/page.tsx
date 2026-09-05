'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { formatNaira } from '@/lib/money';

export default function CampaignReportPage() {
  const params = useParams<{ id: string }>();
  const campaignId = Number(params.id);
  const { campaigns, fetchCampaign, retryCampaign } = useUserStore();
  const toast = useToast();
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');
  const campaign = campaigns.find((c) => c.id === campaignId);

  // Poll the backend (which itself proxies Termii's Fetch Campaign History)
  // every few seconds while the campaign is still in flight.
  useEffect(() => {
    if (!campaign || campaign.status === 'DELIVERED' || campaign.status === 'FAILED') return;
    const interval = setInterval(() => {
      fetchCampaign(campaignId);
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, campaign?.status]);

  useEffect(() => {
    if (!campaign) fetchCampaign(campaignId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  if (!campaign) {
    return (
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-muted">
          &larr; Back to dashboard
        </Link>
        <p className="mt-4 text-sm text-muted">Loading campaign...</p>
      </div>
    );
  }

  const statusColor =
    campaign.status === 'DELIVERED' ? 'text-success' : campaign.status === 'FAILED' ? 'text-danger' : 'text-warning';

  const retry = async () => {
    setRetrying(true);
    setRetryError('');
    const result = await retryCampaign(campaign.id);
    setRetrying(false);
    if (!result.ok) {
      setRetryError(result.error);
      toast.error(result.error);
    } else {
      toast.success('Campaign resend requested.');
    }
  };

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
        <span className={`text-sm font-bold ${statusColor}`}>
          Status: {campaign.status}
          {(campaign.status === 'PENDING' || campaign.status === 'PROCESSING') && ' — refreshing automatically...'}
        </span>
        {campaign.status === 'FAILED' && (
          <button onClick={retry} disabled={retrying} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
            {retrying ? 'Retrying...' : 'Retry campaign'}
          </button>
        )}
      </div>
      {retryError && <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-3 text-sm font-semibold text-danger">{retryError}</div>}

      <h3 className="mb-3 text-base font-bold text-ink">Recipient log</h3>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-2 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>RECIPIENT</span>
          <span>STATUS</span>
        </div>
        {campaign.recipients === 0 && <div className="px-4 py-4 text-sm text-muted">No recipient-level detail available.</div>}
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
