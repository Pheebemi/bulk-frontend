'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { ButtonSpinner } from '@/components/Loader';
import { formatNaira, countSegments } from '@/lib/money';
import type { CampaignChannel } from '@/types';

export default function NewCampaignPage() {
  const { senderIds, groups, wallet, rate, createCampaign } = useUserStore();
  const toast = useToast();
  const router = useRouter();

  // Only ever offer names that can actually send right now: the caller's
  // own approved sender IDs, and the shared ones every account can use
  // immediately. Pending/blocked ones are never selectable here — that's
  // what the Sender IDs page is for.
  const ownSenderIds = senderIds.filter((s) => !s.isShared && s.status === 'active');
  const sharedSenderIds = senderIds.filter((s) => s.isShared);
  const sendableSenderIds = [...ownSenderIds, ...sharedSenderIds];

  const [senderId, setSenderId] = useState('');
  // The list loads asynchronously (the store hydrates from the API), so
  // the default selection is set once real data arrives rather than at
  // the empty initial render.
  useEffect(() => {
    if (!senderId && sendableSenderIds.length > 0) setSenderId(sendableSenderIds[0].name);
  }, [senderId, sendableSenderIds]);
  const [channel, setChannel] = useState<CampaignChannel>('dnd');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState<'group' | 'manual'>('group');
  const [groupId, setGroupId] = useState<number>(groups[0]?.id ?? 0);
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const recipients = useMemo(() => {
    if (source === 'group') return groups.find((g) => g.id === groupId)?.contacts.length ?? 0;
    return manual
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [source, groupId, manual, groups]);

  const segments = countSegments(message);
  const rateForChannel = channel === 'dnd' ? rate.dndRate : rate.genericRate;
  const estimatedCost = recipients * segments * rateForChannel;

  const send = async () => {
    setError('');
    setSending(true);
    const result = await createCampaign({
      senderId,
      channel,
      message,
      groupId: source === 'group' ? groupId : undefined,
      manualNumbers: source === 'manual' ? manual.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : undefined,
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success('Campaign sent.');
    router.push(`/campaigns/${result.campaign.id}`);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink">New campaign</h1>
      <div className="grid max-w-4xl grid-cols-[1.4fr_1fr] gap-6">
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-7">
          <div>
            <div className="mb-2 text-xs font-bold text-muted">SENDER ID</div>
            <select value={senderId} onChange={(e) => setSenderId(e.target.value)} className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm font-semibold text-ink">
              {ownSenderIds.length > 0 ? (
                <>
                  <optgroup label="Your sender IDs">
                    {ownSenderIds.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Instant — send now">
                    {sharedSenderIds.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                </>
              ) : (
                sharedSenderIds.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))
              )}
            </select>
            {ownSenderIds.length === 0 && (
              <p className="mt-2 text-xs text-muted">
                Messages send under a shared name until you have your own.{' '}
                <Link href="/sender-ids" className="font-semibold text-accent">
                  Request a custom sender ID →
                </Link>
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 text-xs font-bold text-muted">CHANNEL</div>
            <div className="flex gap-2">
              <button onClick={() => setChannel('dnd')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${channel === 'dnd' ? 'bg-accentSoft text-accent' : ''}`}>
                DND (Transactional)
              </button>
              <button onClick={() => setChannel('generic')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${channel === 'generic' ? 'bg-accentSoft text-accent' : ''}`}>
                Generic (Promotional)
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-xs font-bold text-muted">MESSAGE</span>
              <span className="text-xs text-muted">
                {message.length} chars · {segments} segment(s)
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your campaign message..."
              className="min-h-[120px] w-full rounded-lg border border-border bg-bg p-3.5 text-sm text-ink"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-bold text-muted">RECIPIENTS</div>
            <div className="mb-3 flex gap-2">
              <button onClick={() => setSource('group')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${source === 'group' ? 'bg-accentSoft text-accent' : ''}`}>
                From a group
              </button>
              <button onClick={() => setSource('manual')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${source === 'manual' ? 'bg-accentSoft text-accent' : ''}`}>
                Paste numbers
              </button>
            </div>
            {source === 'group' ? (
              <select value={groupId} onChange={(e) => setGroupId(Number(e.target.value))} className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm text-ink">
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.contacts.length} contacts
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="2348012345678, 2348023456789, ..."
                className="min-h-[80px] w-full rounded-lg border border-border bg-bg p-3.5 text-sm text-ink"
              />
            )}
          </div>
        </div>

        <div className="h-fit rounded-xl border border-border bg-surface p-7">
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-bold text-muted">RECIPIENTS</div>
            <div className="text-xl font-extrabold text-ink">{recipients}</div>
          </div>
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-bold text-muted">ESTIMATED COST</div>
            <div className="text-2xl font-extrabold text-accent">{formatNaira(estimatedCost)}</div>
          </div>
          <div className="mb-4 text-xs text-muted">Wallet balance after send: {formatNaira(wallet - estimatedCost)}</div>
          {error && <div className="mb-4 rounded-lg bg-danger/10 px-3 py-2.5 text-xs font-semibold text-danger">{error}</div>}
          <button onClick={send} disabled={sendableSenderIds.length === 0 || sending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-50">
            {sending && <ButtonSpinner />}
            {sending ? 'Sending...' : 'Send campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
