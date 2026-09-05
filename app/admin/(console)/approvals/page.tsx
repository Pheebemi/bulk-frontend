'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import type { SenderId, SenderIdStatus, SenderIdVisibility, SmsProvider } from '@/types';

const STATUS_STYLE: Record<SenderIdStatus, string> = {
  active: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  blocked: 'bg-danger/10 text-danger',
};

const PROVIDERS: SmsProvider[] = ['termii', 'sendchamp', 'kudisms'];
const STATUSES: SenderIdStatus[] = ['active', 'pending', 'blocked'];
const PROVIDER_LABEL: Record<SmsProvider, string> = { termii: 'Termii', sendchamp: 'Sendchamp', kudisms: 'KudiSMS' };

type Tab = 'private' | 'shared' | 'admin_only';

const TAB_LABEL: Record<Tab, string> = {
  private: 'Customer requests',
  shared: 'Shared with everyone',
  admin_only: 'Admin only',
};

const TAB_HELP: Record<Tab, string> = {
  private:
    "Requests need you to submit the name on Termii's, Sendchamp's, or KudiSMS's own dashboard by hand, using the stated use case, then mark it approved here — from that point it's usable only by the customer who requested it.",
  shared: 'Every customer can select and send from these immediately, no request needed.',
  admin_only: "Only the admin console's own \"Send platform campaign\" screen can use these — customers never see them.",
};

type EditForm = {
  provider: SmsProvider;
  platformStatus: SenderIdStatus;
  dndWhitelisted: boolean;
  visibility: SenderIdVisibility;
  userEmail: string;
};

function toEditForm(s: SenderId): EditForm {
  return {
    provider: s.provider,
    platformStatus: s.status,
    dndWhitelisted: s.dndWhitelisted,
    visibility: s.visibility ?? 'private',
    userEmail: s.userEmail ?? '',
  };
}

export default function ApprovalsPage() {
  const { senderIds, createSenderId, updateSenderId, deleteSenderId } = useAdminStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('private');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    visibility: 'shared' as SenderIdVisibility,
    provider: 'kudisms' as SmsProvider,
    userEmail: '',
  });

  const rows = senderIds.filter((s) => (s.visibility ?? 'private') === tab);

  const startEdit = (s: SenderId) => {
    setEditingId(s.id);
    setEditForm(toEditForm(s));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = async (id: number) => {
    if (!editForm) return;
    if (editForm.visibility === 'private' && !editForm.userEmail.trim()) {
      toast.error('A private sender ID needs an owner email.');
      return;
    }
    setBusyId(id);
    const result = await updateSenderId(id, {
      provider: editForm.provider,
      platformStatus: editForm.platformStatus,
      dndWhitelisted: editForm.dndWhitelisted,
      visibility: editForm.visibility,
      userEmail: editForm.visibility === 'private' ? editForm.userEmail.trim() : null,
    });
    setBusyId(null);
    if (result.ok) {
      toast.success('Sender ID updated.');
      cancelEdit();
    } else {
      toast.error(result.error);
    }
  };

  const remove = async (s: SenderId) => {
    if (!confirm(`Remove "${s.name}"? This can't be undone.`)) return;
    setBusyId(s.id);
    const result = await deleteSenderId(s.id);
    setBusyId(null);
    if (result.ok) {
      toast.success(`"${s.name}" removed.`);
    } else {
      toast.error(result.error);
    }
  };

  // For a private request Admin has submitted directly on Sendchamp's or
  // KudiSMS's own dashboard and confirmed approved there — a one-click
  // shortcut for the same thing the full edit form can do.
  const approveVia = async (id: number, provider: 'sendchamp' | 'kudisms') => {
    setBusyId(id);
    const result = await updateSenderId(id, { provider, platformStatus: 'active' });
    if (result.ok) {
      toast.success(`Approved via ${provider === 'kudisms' ? 'KudiSMS' : 'Sendchamp'}.`);
    } else {
      toast.error(result.error);
    }
    setBusyId(null);
  };

  const handleCreate = async () => {
    const name = createForm.name.trim();
    if (!name) {
      toast.error('Enter a name first.');
      return;
    }
    if (createForm.visibility === 'private' && !createForm.userEmail.trim()) {
      toast.error('A private sender ID needs an owner email.');
      return;
    }
    setCreating(true);
    const result = await createSenderId({
      name,
      visibility: createForm.visibility,
      provider: createForm.provider,
      platformStatus: 'active',
      userEmail: createForm.visibility === 'private' ? createForm.userEmail.trim() : undefined,
    });
    setCreating(false);
    if (result.ok) {
      toast.success(`"${name}" created.`);
      setCreateForm({ name: '', visibility: createForm.visibility, provider: createForm.provider, userEmail: '' });
      setShowCreate(false);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Sender IDs</h1>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white"
        >
          {showCreate ? 'Cancel' : '+ Add sender ID'}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <label className="flex flex-col gap-1 text-xs font-bold text-muted">
            NAME
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. AT-HUB"
              maxLength={11}
              className="w-36 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-muted">
            VISIBILITY
            <select
              value={createForm.visibility}
              onChange={(e) => setCreateForm((f) => ({ ...f, visibility: e.target.value as SenderIdVisibility }))}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink"
            >
              <option value="shared">Shared (everyone)</option>
              <option value="admin_only">Admin only</option>
              <option value="private">Private (one customer)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold text-muted">
            PROVIDER
            <select
              value={createForm.provider}
              onChange={(e) => setCreateForm((f) => ({ ...f, provider: e.target.value as SmsProvider }))}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          {createForm.visibility === 'private' && (
            <label className="flex flex-col gap-1 text-xs font-bold text-muted">
              OWNER EMAIL
              <input
                value={createForm.userEmail}
                onChange={(e) => setCreateForm((f) => ({ ...f, userEmail: e.target.value }))}
                placeholder="customer@email.com"
                className="w-48 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink"
              />
            </label>
          )}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-bold text-ink disabled:opacity-60"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      <div className="mb-4 flex gap-1 border-b border-border">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${
              tab === t ? 'border-accent text-accent' : 'border-transparent text-muted'
            }`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      <p className="mb-4 max-w-2xl text-sm text-muted">{TAB_HELP[tab]}</p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="grid min-w-[820px] grid-cols-7 border-b border-border px-4 py-3 text-xs font-bold text-muted">
          <span>SENDER ID</span>
          <span>{tab === 'private' ? 'USER' : 'SCOPE'}</span>
          <span>PROVIDER</span>
          <span>STATUS</span>
          <span>DND</span>
          <span>CREATED</span>
          <span>ACTIONS</span>
        </div>
        {rows.length === 0 && <div className="px-4 py-5 text-sm text-muted">Nothing here yet.</div>}
        {rows.map((s) => {
          const isEditing = editingId === s.id;
          return (
            <div key={s.id} className="min-w-[820px] border-b border-border px-4 py-3.5 text-sm last:border-b-0">
              {!isEditing ? (
                <div className="grid grid-cols-7 items-center">
                  <div className="flex flex-col">
                    <span className="font-semibold">{s.name}</span>
                    {s.useCase && (
                      <span className="truncate text-xs text-muted" title={s.useCase}>
                        {s.useCase}
                      </span>
                    )}
                  </div>
                  <span className="text-muted">
                    {tab === 'private' ? (s.userEmail ?? '—') : tab === 'shared' ? 'Everyone' : 'Admin only'}
                  </span>
                  <span className="text-muted">{PROVIDER_LABEL[s.provider]}</span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                  <span className="text-muted">{s.provider === 'termii' ? (s.dndWhitelisted ? 'Yes' : 'No') : '—'}</span>
                  <span className="text-muted">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tab === 'private' && s.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveVia(s.id, 'kudisms')}
                          disabled={busyId === s.id}
                          className="rounded-md bg-border px-2.5 py-1.5 text-xs font-bold !text-muted disabled:opacity-60"
                        >
                          Approve via KudiSMS
                        </button>
                        <button
                          onClick={() => approveVia(s.id, 'sendchamp')}
                          disabled={busyId === s.id}
                          className="rounded-md bg-border px-2.5 py-1.5 text-xs font-bold !text-muted disabled:opacity-60"
                        >
                          Approve via Sendchamp
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => startEdit(s)}
                      disabled={busyId === s.id}
                      className="rounded-md border border-border px-2.5 py-1.5 text-xs font-bold text-ink disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(s)}
                      disabled={busyId === s.id}
                      className="rounded-md bg-danger/10 px-2.5 py-1.5 text-xs font-bold text-danger disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                editForm && (
                  <div className="flex flex-wrap items-end gap-3">
                    <span className="font-semibold">{s.name}</span>
                    <label className="flex flex-col gap-1 text-xs font-bold text-muted">
                      VISIBILITY
                      <select
                        value={editForm.visibility}
                        onChange={(e) => setEditForm((f) => f && { ...f, visibility: e.target.value as SenderIdVisibility })}
                        className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-ink"
                      >
                        <option value="private">Private</option>
                        <option value="shared">Shared</option>
                        <option value="admin_only">Admin only</option>
                      </select>
                    </label>
                    {editForm.visibility === 'private' && (
                      <label className="flex flex-col gap-1 text-xs font-bold text-muted">
                        OWNER EMAIL
                        <input
                          value={editForm.userEmail}
                          onChange={(e) => setEditForm((f) => f && { ...f, userEmail: e.target.value })}
                          className="w-48 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-ink"
                        />
                      </label>
                    )}
                    <label className="flex flex-col gap-1 text-xs font-bold text-muted">
                      PROVIDER
                      <select
                        value={editForm.provider}
                        onChange={(e) => setEditForm((f) => f && { ...f, provider: e.target.value as SmsProvider })}
                        className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-ink"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p} value={p}>
                            {PROVIDER_LABEL[p]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-bold text-muted">
                      STATUS
                      <select
                        value={editForm.platformStatus}
                        onChange={(e) => setEditForm((f) => f && { ...f, platformStatus: e.target.value as SenderIdStatus })}
                        className="rounded-lg border border-border bg-bg px-2.5 py-1.5 text-sm text-ink"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </label>
                    {editForm.provider === 'termii' && (
                      <label className="flex items-center gap-1.5 pb-1.5 text-xs font-bold text-muted">
                        <input
                          type="checkbox"
                          checked={editForm.dndWhitelisted}
                          onChange={(e) => setEditForm((f) => f && { ...f, dndWhitelisted: e.target.checked })}
                        />
                        DND whitelisted
                      </label>
                    )}
                    <button
                      onClick={() => saveEdit(s.id)}
                      disabled={busyId === s.id}
                      className="rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      Save
                    </button>
                    <button onClick={cancelEdit} className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-ink">
                      Cancel
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
