'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { formatNaira, countSegments } from '@/lib/money';
import type { CampaignChannel } from '@/types';

export default function NewCampaignPage() {
  const { senderIds, groups, wallet, rate, createCampaign } = useUserStore();
  const router = useRouter();

  const activeSenderIds = senderIds.filter((s) => s.status === 'active');
  const [senderId, setSenderId] = useState(activeSenderIds[0]?.name ?? '');
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
      return;
    }
    router.push(`/campaigns/${result.campaign.id}`);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink">New campaign</h1>
      {activeSenderIds.length === 0 && (
        <div className="mb-4 max-w-2xl rounded-lg bg-warning/10 px-3.5 py-3 text-sm font-semibold text-warning">
          You have no active Sender ID yet — requests are reviewed by Termii before they can send.
        </div>
      )}
      <div className="grid max-w-4xl grid-cols-[1.4fr_1fr] gap-6">
        <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-7">
          <div>
            <div className="mb-2 text-xs font-bold text-muted">SENDER ID</div>
            <select value={senderId} onChange={(e) => setSenderId(e.target.value)} className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm font-semibold text-ink">
              {activeSenderIds.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
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
          <button onClick={send} disabled={activeSenderIds.length === 0 || sending} className="w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-50">
            {sending ? 'Sending...' : 'Send campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
