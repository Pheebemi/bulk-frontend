/** Shared loading visuals — one spinner, three sizes, used everywhere
 *  something is in flight: an initial page load, a busy button, or a
 *  section of a page waiting on its own fetch. */

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path
        className="opacity-90"
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small — sits inline inside a busy button, next to its label. */
export function ButtonSpinner() {
  return <Spinner className="h-4 w-4 text-current" />;
}

/** Medium — a section of a page (a table, a card) waiting on its own data. */
export function SectionLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-muted">
      <Spinner className="h-7 w-7 text-accent" />
      {label && <span className="text-sm font-semibold">{label}</span>}
    </div>
  );
}

/** Large — a whole page still waiting on its first data load, shown in
 *  place of the page shell rather than a false "nothing here yet". */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner className="h-9 w-9 text-accent" />
      {label && <span className="text-sm font-semibold">{label}</span>}
    </div>
  );
}
