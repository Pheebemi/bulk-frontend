'use client';

import { useState } from 'react';

/* Small building blocks shared across the landing page sections. */

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  blurb,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  blurb?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 max-w-3xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <div className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">{eyebrow}</div>
      )}
      <h2 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">{title}</h2>
      {blurb && <p className="mt-4 text-base leading-relaxed text-muted">{blurb}</p>}
    </div>
  );
}

export function Card({
  title,
  body,
  cta = 'Explore',
}: {
  title: string;
  body: string;
  cta?: string | null;
}) {
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5">
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{body}</p>
      {cta && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-accent">
          {cta}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      )}
    </div>
  );
}

/* Tabbed feature explorer — mirrors the tabbed capabilities block. */
export function FeatureTabs({
  features,
}: {
  features: { name: string; title: string; body: string; points: string[] }[];
}) {
  const [active, setActive] = useState(0);
  const current = features[active];

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {features.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              i === active
                ? 'bg-accent text-white'
                : 'border border-border bg-surface text-muted hover:text-ink'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      <div className="grid items-center gap-8 rounded-2xl border border-border bg-surface p-8 md:grid-cols-2 md:p-10">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-ink">{current.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{current.body}</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {current.points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-bg p-6">
          <PhonePreview />
        </div>
      </div>
    </div>
  );
}

/* Simple inline SMS mock — no external images, so nothing to load. */
function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-[28px] border-8 border-sidebar bg-surface p-3 shadow-xl">
      <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-border" />
      <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted">
        REACHLY
      </div>
      <div className="flex flex-col gap-2">
        <div className="rounded-xl rounded-tl-sm bg-surface2 px-3 py-2 text-[11px] leading-snug text-ink">
          Your order #4821 has shipped. Track it at rchly.co/t/4821
        </div>
        <div className="rounded-xl rounded-tl-sm bg-surface2 px-3 py-2 text-[11px] leading-snug text-ink">
          Your OTP is 402913. It expires in 5 minutes.
        </div>
        <div className="self-end rounded-xl rounded-br-sm bg-accent px-3 py-2 text-[11px] font-medium text-white">
          Delivered ✓
        </div>
      </div>
    </div>
  );
}

/* FAQ accordion. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <span className="font-display text-base font-bold text-ink">{item.q}</span>
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-6 pb-5 text-sm leading-relaxed text-muted">{item.a}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
