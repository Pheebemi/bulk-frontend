'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { formatNaira } from '@/lib/money';

export default function AdminWalletsPage() {
  const { users, adjustUserBalance } = useAdminStore();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const filtered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));
  const selected = users.find((u) => u.id === selectedId) ?? users[0];

  const apply = (sign: 1 | -1) => {
    const value = parseFloat(amount);
    if (!value || value <= 0 || !selected) return;
    adjustUserBalance(selected.id, sign * value, reason || (sign > 0 ? 'Manual credit' : 'Manual debit'));
    setAmount('');
    setReason('');
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink">User wallets</h1>
      <div className="grid grid-cols-[1fr_1.3fr] gap-6">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name..."
            className="mb-3 w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm text-ink"
          />
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedId(u.id)}
                className={`flex w-full items-center justify-between border-b border-border px-4 py-3.5 text-left text-sm last:border-b-0 ${
                  u.id === selectedId ? 'bg-accentSoft' : ''
                }`}
              >
                <span>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-muted">{u.email}</div>
                </span>
                <span className="font-bold">{formatNaira(u.balance)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-fit rounded-xl border border-border bg-surface p-6">
          {selected && (
            <>
              <div className="mb-1 text-xs font-bold text-muted">{selected.name}</div>
              <div className="mb-5 text-2xl font-extrabold text-ink">{formatNaira(selected.balance)}</div>

              <h3 className="mb-2 text-xs font-bold text-muted">RECENT HISTORY</h3>
              <div className="mb-5">
                {selected.history.length === 0 && <div className="text-sm text-muted">No manual adjustments yet.</div>}
                {selected.history.map((h) => (
                  <div key={h.id} className="flex justify-between border-b border-border py-2 text-sm last:border-b-0">
                    <span className="text-muted">{h.description}</span>
                    <span className={`font-bold ${h.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                      {h.amount >= 0 ? '+' : ''}
                      {formatNaira(h.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <h3 className="mb-2 text-xs font-bold text-muted">MANUAL ADJUSTMENT</h3>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount (NGN)"
                className="mb-2.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (e.g. bank transfer top-up)"
                className="mb-3.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink"
              />
              <div className="flex gap-2.5">
                <button onClick={() => apply(1)} className="flex-1 rounded-lg bg-success py-2.5 text-sm font-bold text-white">
                  Credit
                </button>
                <button onClick={() => apply(-1)} className="flex-1 rounded-lg bg-danger py-2.5 text-sm font-bold text-white">
                  Debit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
