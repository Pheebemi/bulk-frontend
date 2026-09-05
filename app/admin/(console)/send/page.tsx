'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { formatNaira, countSegments } from '@/lib/money';
import type { CampaignChannel } from '@/types';

export default function AdminSendPage() {
  const { rate, setRate, senderIds, users, adminCampaigns, sendCampaign, refreshUsers } = useAdminStore();
  const toast = useToast();
  const activeSenderIds = senderIds.filter((s) => s.status === 'active');
  const [senderId, setSenderId] = useState('');
  const [channel, setChannel] = useState<CampaignChannel>('generic');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'custom'>('all');
  const [manual, setManual] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [genericRate, setGenericRate] = useState(String(rate.genericRate));
  const [dndRate, setDndRate] = useState(String(rate.dndRate));

  useEffect(() => {
    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!senderId && activeSenderIds.length > 0) setSenderId(activeSenderIds[0].name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSenderIds.length]);

  const manualNumbers = manual.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  const recipients = target === 'all' ? users.length : manualNumbers.length;

  const segments = countSegments(message);
  const estimatedCost = recipients * segments * (channel === 'dnd' ? rate.dndRate : rate.genericRate);

  const send = async () => {
    if (recipients === 0 || !senderId) return;
    setError('');
    setSending(true);
    const result = await sendCampaign({
      senderId,
      channel,
      message,
      manualNumbers: target === 'custom' ? manualNumbers : undefined,
      recipientCount: target === 'all' ? recipients : undefined,
    });
    setSending(false);
    if (result.ok) {
      setSuccess(true);
      setMessage('');
      setManual('');
      toast.success(`Campaign sent to ${recipients.toLocaleString()} recipient(s).`);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  const saveRate = async () => {
    try {
      await setRate({ genericRate: parseFloat(genericRate) || rate.genericRate, dndRate: parseFloat(dndRate) || rate.dndRate });
      toast.success('Platform rate updated.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the rate.');
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Send platform campaign</h1>
      <p className="mb-6 text-sm text-muted">Admin sends are not charged to a wallet — cost is tracked here for your own reporting.</p>

      <div className="mb-8 max-w-3xl rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-3 text-sm font-bold text-ink">Platform selling rate (charged to users)</h3>
        <div className="flex items-end gap-4">
          <div>
            <div className="mb-1.5 text-xs font-bold text-muted">GENERIC (₦/segment)</div>
            <input value={genericRate} onChange={(e) => setGenericRate(e.target.value)} className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink" />
          </div>
          <div>
            <div className="mb-1.5 text-xs font-bold text-muted">DND (₦/segment)</div>
            <input value={dndRate} onChange={(e) => setDndRate(e.target.value)} className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink" />
          </div>
          <button onClick={saveRate} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white">
            Save rate
          </button>
        </div>
      </div>

      {activeSenderIds.length === 0 && (
        <div className="mb-4 max-w-3xl rounded-lg bg-warning/10 px-3.5 py-3 text-sm font-semibold text-warning">
          No active Sender ID on the platform yet — an admin send needs one that Termii has already approved.
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
              <button onClick={() => setChannel('generic')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${channel === 'generic' ? 'bg-accentSoft text-accent' : ''}`}>
                Generic
              </button>
              <button onClick={() => setChannel('dnd')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${channel === 'dnd' ? 'bg-accentSoft text-accent' : ''}`}>
                DND
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
              placeholder="Platform-wide announcement..."
              className="min-h-[120px] w-full rounded-lg border border-border bg-bg p-3.5 text-sm text-ink"
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-bold text-muted">TARGET</div>
            <div className="mb-3 flex gap-2">
              <button onClick={() => setTarget('all')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${target === 'all' ? 'bg-accentSoft text-accent' : ''}`}>
                All users ({users.length.toLocaleString()})
              </button>
              <button onClick={() => setTarget('custom')} className={`rounded-lg border border-border px-3.5 py-2 text-sm font-semibold ${target === 'custom' ? 'bg-accentSoft text-accent' : ''}`}>
                Custom list
              </button>
            </div>
            {target === 'custom' && (
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
            <div className="text-xl font-extrabold text-ink">{recipients.toLocaleString()}</div>
          </div>
          <div className="mb-4">
            <div className="mb-1.5 text-xs font-bold text-muted">ESTIMATED COST (tracked, not charged)</div>
            <div className="text-2xl font-extrabold text-accent">{formatNaira(estimatedCost)}</div>
          </div>
          {error && <div className="mb-3 rounded-lg bg-danger/10 px-3 py-2.5 text-xs font-semibold text-danger">{error}</div>}
          <button onClick={send} disabled={sending || activeSenderIds.length === 0} className="w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60">
            {sending ? 'Sending...' : 'Send campaign'}
          </button>
          {success && <div className="mt-3.5 rounded-lg bg-accentSoft px-3 py-2.5 text-xs font-semibold text-accent">Campaign sent and logged.</div>}
        </div>
      </div>

      <h3 className="mb-3 mt-8 text-base font-bold text-ink">Admin campaign history</h3>
      <div className="max-w-4xl overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid grid-cols-4 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>CAMPAIGN</span>
          <span>RECIPIENTS</span>
          <span>COST</span>
          <span>DATE</span>
        </div>
        {adminCampaigns.length === 0 && <div className="px-4 py-5 text-sm text-muted">No admin campaigns sent yet.</div>}
        {adminCampaigns.map((c) => (
          <div key={c.id} className="grid grid-cols-4 border-b border-border px-4 py-3.5 text-sm last:border-b-0">
            <span className="font-semibold">{c.name}</span>
            <span className="text-muted">{c.recipients.toLocaleString()}</span>
            <span className="text-muted">{formatNaira(c.termiiCost)}</span>
            <span className="text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
