import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoMark } from '@/components/icons';
import { Card, Faq, FeatureTabs, SectionHeading, Stat } from '@/components/landing';

export const metadata: Metadata = {
  title: 'Reachly — Bulk SMS for Nigerian businesses',
  description:
    'Send bulk SMS to every Nigerian network, including DND numbers. Pay per message, manage contacts, and track delivery in one dashboard.',
};

const useCases = [
  { title: 'Promotional SMS', body: 'Announce sales, drops and offers to a contact group in one send, with the cost shown before you confirm.' },
  { title: 'OTP & 2FA', body: 'One-time codes over the DND route, so verification messages reach customers who have blocked marketing traffic.' },
  { title: 'Transactional alerts', body: 'Order confirmations, payment receipts and dispatch notices triggered from your own systems.' },
  { title: 'Reminders', body: 'Appointment, renewal and repayment nudges scheduled against a saved contact group.' },
  { title: 'Service notifications', body: 'Downtime notices, delivery updates and account alerts sent to everyone at once.' },
  { title: 'Customer re-engagement', body: 'Win-back campaigns to lapsed customers, segmented by the groups you have built.' },
];

const industries = [
  { title: 'Financial services', body: 'OTPs, balance alerts and repayment reminders on the DND route, where delivery is not optional.' },
  { title: 'eCommerce', body: 'Order confirmations, dispatch notices and campaign blasts to your customer list.' },
  { title: 'Schools & training', body: 'Fee reminders, results notifications and announcements to parents and students.' },
  { title: 'Healthcare', body: 'Appointment reminders and follow-up messages that cut no-shows.' },
  { title: 'Logistics', body: 'Pickup, transit and delivery updates triggered from your dispatch system.' },
  { title: 'Churches & associations', body: 'Service times, events and dues reminders to your whole register in one send.' },
];

const features = [
  {
    name: 'Contact groups',
    title: 'Your contact list stays in your database',
    body: 'Upload a CSV or add numbers by hand. Contacts are stored on Reachly and handed to the network only as the recipient list of a send — never copied into a third-party phonebook you cannot clear.',
    points: ['CSV import with first name, last name and number', 'Unlimited groups per account', 'Remove a contact and it is gone for good'],
  },
  {
    name: 'DND routing',
    title: 'Reach numbers on the DND register',
    body: 'Most Nigerian numbers sit on the Do-Not-Disturb list, which silently drops ordinary marketing traffic. The DND route carries your message anyway, and we check a number’s status before you send.',
    points: ['Live DND lookup per number', 'Separate rate so the cost is never a surprise', 'Works across MTN, Airtel, Glo and 9mobile'],
  },
  {
    name: 'Sender IDs',
    title: 'Your brand name on every message',
    body: 'Messages arrive from your business name rather than a random number. Request a sender ID from the dashboard and we submit it for network approval on your behalf.',
    points: ['Up to 11 characters', 'Request and track status in one place', 'Multiple sender IDs per account'],
  },
  {
    name: 'Wallet',
    title: 'Pay as you go, no monthly fee',
    body: 'Fund your wallet by card or transfer and spend it down per message. The exact cost of a campaign is calculated and shown before you confirm the send.',
    points: ['No subscription or minimum spend', 'Full transaction history', 'Unsent messages are refunded automatically'],
  },
  {
    name: 'Delivery reports',
    title: 'See what actually landed',
    body: 'Every campaign records how many messages were delivered and how many failed, down to the individual recipient, so you are never guessing whether a send worked.',
    points: ['Per-recipient delivery log', 'Campaign-level delivered and failed counts', 'Partial sends refund the difference'],
  },
];

const faqs = [
  {
    q: 'What does it cost to send an SMS?',
    a: 'You pay per message segment, with a separate rate for the DND route. There is no monthly fee and no minimum spend — you fund a wallet and it is drawn down as you send. Current rates are shown in your dashboard, and a campaign’s exact cost is calculated before you confirm it.',
  },
  {
    q: 'What counts as one message?',
    a: 'A segment is 160 characters. Messages using certain special characters drop to 70 characters per segment. A longer message is charged as multiple segments, and the total is shown before you send.',
  },
  {
    q: 'Can I reach numbers on the DND list?',
    a: 'Yes. Nigerian networks block ordinary marketing traffic to numbers on the Do-Not-Disturb register. The DND route delivers to them at a slightly higher per-segment rate, and you can check any number’s DND status from the dashboard first.',
  },
  {
    q: 'How long does a sender ID take to approve?',
    a: 'Sender IDs are approved by the mobile networks, not by us, and typically take one to two business days. You can request one from the dashboard and track its status there; some applications need supporting business documents.',
  },
  {
    q: 'How do I add my contacts?',
    a: 'Upload a CSV with phone_number, first_name and last_name columns, or a single column of numbers. You can also add contacts one at a time. Contacts are grouped, and a campaign is sent to a whole group at once.',
  },
  {
    q: 'What happens if a send fails partway through?',
    a: 'You are only charged for the messages that actually went out. If a campaign stops halfway, the recipients who were never sent to are refunded to your wallet automatically and the campaign is marked as partially delivered.',
  },
];

const checklist = [
  ['Delivery, not just sending', 'A cheap route that silently drops messages costs more than a reliable one. Ask any provider for delivery rates, not send counts.'],
  ['DND coverage', 'If your provider cannot reach the Do-Not-Disturb register, a large share of Nigerian numbers will never see your message.'],
  ['Transparent per-message pricing', 'You should know the exact cost of a campaign before you confirm it, including how many segments a long message becomes.'],
  ['Refunds on failure', 'Find out what happens when a send fails halfway. You should not pay for messages that were never delivered.'],
  ['Sender ID support', 'Messages from a business name are trusted far more than messages from a number. Check the provider will register one for you.'],
  ['Control of your contact data', 'Know where your customer numbers are stored, and confirm you can delete them.'],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* ---- Nav ---- */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-xl font-extrabold text-ink">Reachly</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted md:flex">
            <a href="#use-cases" className="!text-muted hover:!text-ink">Use cases</a>
            <a href="#features" className="!text-muted hover:!text-ink">Features</a>
            <a href="#pricing" className="!text-muted hover:!text-ink">Pricing</a>
            <a href="#faq" className="!text-muted hover:!text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden rounded-lg px-4 py-2.5 text-sm font-bold !text-ink sm:block">
              Log in
            </Link>
            <Link href="/login" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold !text-white">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ---- Hero ---- */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-accentSoft px-3.5 py-1.5 text-xs font-bold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Delivers to DND numbers
              </div>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl lg:text-6xl">
                Bulk SMS that actually reaches Nigerian phones
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                Send to every network, including numbers on the Do-Not-Disturb register.
                Pay only for the messages you send, manage your contacts, and see exactly
                what was delivered.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className="rounded-lg bg-accent px-6 py-3.5 text-sm font-bold !text-white">
                  Create a free account
                </Link>
                <a href="#pricing" className="rounded-lg border border-border bg-surface px-6 py-3.5 text-sm font-bold !text-ink">
                  See pricing
                </a>
              </div>
              <p className="mt-4 text-xs text-muted">No monthly fee. No minimum spend.</p>

              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
                <Stat value="4" label="Networks covered" />
                <Stat value="DND" label="Route included" />
                <Stat value="160" label="Characters per segment" />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-8">
              <div className="mb-4 text-xs font-bold uppercase tracking-widest text-muted">
                New campaign
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted">Sender ID</span>
                  <span className="font-bold text-ink">PHEEDEV</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted">Group</span>
                  <span className="font-bold text-ink">VIP Customers · 1,240</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted">Route</span>
                  <span className="font-bold text-ink">DND</span>
                </div>
                <div className="flex justify-between border-b border-border pb-3">
                  <span className="text-muted">Segments</span>
                  <span className="font-bold text-ink">1 × 1,240</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-bold text-ink">Cost</span>
                  <span className="font-bold text-accent">Shown before you confirm</span>
                </div>
              </div>
              <div className="mt-6 rounded-lg bg-accent px-4 py-3 text-center text-sm font-bold text-white">
                Send campaign
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Use cases ---- */}
      <section id="use-cases" className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Use cases"
            title="One platform for every message you send"
            blurb="From one-time passwords to a campaign for your whole customer list."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((u) => (
              <Card key={u.title} {...u} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Industries ---- */}
      <section className="border-b border-border bg-surface2/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Industries"
            title="Built for how Nigerian businesses message"
            blurb="The route, the sender ID and the pricing that each sector actually needs."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((i) => (
              <Card key={i.title} {...i} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Pricing ---- */}
      <section id="pricing" className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Pricing"
            title="Pay for the messages you send"
            blurb="Fund a wallet, spend it down per message. Nothing monthly, and unsent messages come back to your balance."
          />
          <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-8">
              <div className="text-sm font-bold text-muted">Standard route</div>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">
                Everyday campaigns
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                For customers not on the Do-Not-Disturb register. Best for general
                campaigns and notifications, at the lower of our two per-segment rates.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-accent bg-surface p-8">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-accent">DND route</div>
                <span className="rounded-full bg-accentSoft px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-accent">
                  Reaches everyone
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">
                Messages that must arrive
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Delivers to numbers on the DND register, where standard traffic is
                blocked. Required for OTPs and time-critical alerts.
              </p>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted">
            A segment is 160 characters, or 70 if the message contains special characters.
            Longer messages are charged per segment. Current rates for both routes are shown
            in your dashboard, and the exact cost of a campaign is calculated before you confirm.
          </p>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section id="features" className="border-b border-border bg-surface2/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Platform"
            title="Everything you need to run a campaign"
          />
          <FeatureTabs features={features} />
        </div>
      </section>

      {/* ---- Choosing a provider ---- */}
      <section className="border-b border-border bg-surface2/40 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading
            eyebrow="Buyer's guide"
            title="How to choose a bulk SMS provider in Nigeria"
            blurb="Worth asking any provider, including us."
          />
          <div className="grid gap-5 md:grid-cols-2">
            {checklist.map(([title, body]) => (
              <div key={title} className="flex gap-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section id="faq" className="border-b border-border py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeading eyebrow="FAQ" title="Questions people ask before signing up" />
          <Faq items={faqs} />
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      {/* Sits as a card on the page rather than a full-bleed band: in dark mode
          --color-sidebar and --color-bg are nearly the same value, so a plain
          background would make this section vanish. */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-sidebar px-6 py-16 text-center shadow-xl shadow-accent/5">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Send your first campaign today
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Create an account, fund your wallet, and send. No subscription, no minimum spend.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="rounded-lg bg-accent px-6 py-3.5 text-sm font-bold !text-white">
              Create a free account
            </Link>
            <Link href="/login" className="rounded-lg border border-white/20 px-6 py-3.5 text-sm font-bold !text-white">
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border bg-bg py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display font-extrabold text-ink">Reachly</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#use-cases" className="!text-muted hover:!text-ink">Use cases</a>
            <a href="#pricing" className="!text-muted hover:!text-ink">Pricing</a>
            <a href="#faq" className="!text-muted hover:!text-ink">FAQ</a>
            <Link href="/login" className="!text-muted hover:!text-ink">Log in</Link>
          </div>
          <div>© {new Date().getFullYear()} Reachly</div>
        </div>
      </footer>
    </div>
  );
}
