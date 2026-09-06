'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { ButtonSpinner } from '@/components/Loader';
import { formatNaira } from '@/lib/money';

export default function AdminWalletsPage() {
  const { users, usersHasMore, usersTotal, adjustUserBalance, refreshUsers, loadMoreUsers } = useAdminStore();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number>(users[0]?.id ?? 0);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Search runs server-side now that the user list is paginated — a
  // fetched page is only ever a slice of the whole table, so filtering
  // it client-side would silently miss every match not on that page.
  // Debounced so it doesn't refetch on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => refreshUsers(query), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadMoreUsers();
    setLoadingMore(false);
  };

  const selected = users.find((u) => u.id === selectedId) ?? users[0];

  const apply = async (direction: 'credit' | 'debit') => {
    const value = parseFloat(amount);
    if (!value || value <= 0 || !selected) return;
    setError('');
    setBusy(true);
    const result = await adjustUserBalance(selected.id, value, direction, reason || (direction === 'credit' ? 'Manual credit' : 'Manual debit'));
    setBusy(false);
    if (result.ok) {
      setAmount('');
      setReason('');
      toast.success(`${direction === 'credit' ? 'Credited' : 'Debited'} ${formatNaira(value)} ${direction === 'credit' ? 'to' : 'from'} ${selected.name}.`);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
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
            {users.map((u) => (
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
            {usersHasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full px-4 py-3 text-center text-xs font-bold text-accent disabled:opacity-60"
              >
                {loadingMore ? 'Loading...' : `Load more (showing ${users.length} of ${usersTotal.toLocaleString()})`}
              </button>
            )}
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
              {error && <div className="mb-3 rounded-lg bg-danger/10 px-3 py-2.5 text-xs font-semibold text-danger">{error}</div>}
              <div className="flex gap-2.5">
                <button onClick={() => apply('credit')} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {busy && <ButtonSpinner />}
                  Credit
                </button>
                <button onClick={() => apply('debit')} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {busy && <ButtonSpinner />}
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
