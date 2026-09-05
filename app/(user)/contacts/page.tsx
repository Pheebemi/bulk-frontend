'use client';

import { useRef, useState } from 'react';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { ButtonSpinner } from '@/components/Loader';

export default function ContactsPage() {
  const { groups, uploadCsv, createGroup, addContact } = useUserStore();
  const toast = useToast();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [newGroupName, setNewGroupName] = useState('');
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [contactForms, setContactForms] = useState<Record<number, { firstName: string; lastName: string; phone: string }>>({});
  const [addingContactTo, setAddingContactTo] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (id: number) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const result = await uploadCsv(file, newGroupName.trim() || file.name);
    setUploading(false);
    if (result.ok) {
      setFlash(`${file.name} imported into a new group.`);
      setNewGroupName('');
      setTimeout(() => setFlash(''), 4000);
      toast.success(`${file.name} imported.`);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
    e.target.value = '';
  };

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) {
      toast.error('Enter a group name first.');
      return;
    }
    setCreatingGroup(true);
    try {
      await createGroup(name);
      setNewGroupName('');
      toast.success(`"${name}" created.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create that group.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const contactForm = (groupId: number) => contactForms[groupId] ?? { firstName: '', lastName: '', phone: '' };
  const setContactForm = (groupId: number, patch: Partial<{ firstName: string; lastName: string; phone: string }>) =>
    setContactForms((f) => ({ ...f, [groupId]: { ...contactForm(groupId), ...patch } }));

  const handleAddContact = async (groupId: number) => {
    const form = contactForm(groupId);
    if (!form.phone.trim()) {
      toast.error('Enter a phone number first.');
      return;
    }
    setAddingContactTo(groupId);
    try {
      await addContact(groupId, form);
      setContactForms((f) => ({ ...f, [groupId]: { firstName: '', lastName: '', phone: '' } }));
      toast.success('Contact added.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add that contact.');
    } finally {
      setAddingContactTo(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">Contact groups</h1>
        <div className="flex items-center gap-2">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
          />
          <button
            onClick={handleCreateGroup}
            disabled={creatingGroup}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-bold text-ink disabled:opacity-60"
          >
            {creatingGroup && <ButtonSpinner />}
            {creatingGroup ? 'Creating...' : 'Create group'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {uploading && <ButtonSpinner />}
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {flash && <div className="mb-4 rounded-lg bg-accentSoft px-3.5 py-3 text-sm font-semibold text-accent">{flash}</div>}
      {error && <div className="mb-4 rounded-lg bg-danger/10 px-3.5 py-3 text-sm font-semibold text-danger">{error}</div>}
      <p className="mb-4 text-xs text-muted">CSV columns: phone_number, first_name (optional), last_name (optional).</p>

      <div className="flex flex-col gap-3">
        {groups.length === 0 && (
          <div className="text-sm text-muted">No contact groups yet — create one or upload a CSV.</div>
        )}
        {groups.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <button onClick={() => toggle(g.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
              <div>
                <div className="text-sm font-bold">{g.name}</div>
                <div className="text-xs text-muted">{g.contactCount} contacts</div>
              </div>
              <span className="text-sm font-semibold text-muted">{expanded[g.id] ? 'Hide' : 'Show'}</span>
            </button>
            {expanded[g.id] && (
              <div className="border-t border-border">
                {g.contacts.map((c) => (
                  <div key={c.id} className="flex justify-between px-5 py-2.5 text-sm border-b border-border last:border-b-0">
                    <span>
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-muted">{c.phone}</span>
                  </div>
                ))}
                {g.contacts.length === 0 && <div className="px-5 py-3 text-sm text-muted">No contacts in this group yet.</div>}
                <div className="flex flex-wrap items-center gap-2 border-t border-border bg-bg/40 px-5 py-3">
                  <input
                    value={contactForm(g.id).firstName}
                    onChange={(e) => setContactForm(g.id, { firstName: e.target.value })}
                    placeholder="First name"
                    className="w-28 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
                  />
                  <input
                    value={contactForm(g.id).lastName}
                    onChange={(e) => setContactForm(g.id, { lastName: e.target.value })}
                    placeholder="Last name"
                    className="w-28 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
                  />
                  <input
                    value={contactForm(g.id).phone}
                    onChange={(e) => setContactForm(g.id, { phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-36 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
                  />
                  <button
                    onClick={() => handleAddContact(g.id)}
                    disabled={addingContactTo === g.id}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {addingContactTo === g.id && <ButtonSpinner />}
                    {addingContactTo === g.id ? 'Adding...' : 'Add contact'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
