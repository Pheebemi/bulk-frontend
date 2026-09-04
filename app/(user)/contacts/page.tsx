'use client';

import { useState } from 'react';
import { useUserStore } from '@/lib/store';

export default function ContactsPage() {
  const { groups, addGroup, addContact } = useUserStore();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newGroupName, setNewGroupName] = useState('');
  const [uploadedFlash, setUploadedFlash] = useState(false);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleUploadCsv = () => {
    // TODO: parse a real CSV and POST to bulk-backend, which syncs a Termii
    // phonebook (create phonebook, then bulk-upload contacts).
    const group = addGroup(newGroupName.trim() || `Imported group ${groups.length + 1}`);
    addContact(group.id, { firstName: 'Sample', lastName: 'Contact', phone: '2348000000000' });
    setNewGroupName('');
    setUploadedFlash(true);
    setTimeout(() => setUploadedFlash(false), 3000);
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
          <button onClick={handleUploadCsv} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white">
            Upload CSV
          </button>
        </div>
      </div>

      {uploadedFlash && (
        <div className="mb-4 rounded-lg bg-accentSoft px-3.5 py-3 text-sm font-semibold text-accent">
          Contacts imported into a new group.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <button onClick={() => toggle(g.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
              <div>
                <div className="text-sm font-bold">{g.name}</div>
                <div className="text-xs text-muted">{g.contacts.length} contacts</div>
              </div>
              <span className="text-sm font-semibold text-muted">{expanded[g.id] ? 'Hide' : 'Show'}</span>
            </button>
            {expanded[g.id] && (
              <div className="border-t border-border">
                {g.contacts.map((c) => (
                  <div key={c.id} className="flex justify-between border-b border-border px-5 py-2.5 text-sm last:border-b-0">
                    <span>
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="text-muted">{c.phone}</span>
                  </div>
                ))}
                {g.contacts.length === 0 && <div className="px-5 py-3 text-sm text-muted">No contacts in this group yet.</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
