import { cn } from "@/lib/cn";

/** Solid mug; the grapefruit line at the rim is the coffee. */
export function MugMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M4 7h19v14a6 6 0 0 1-6 6h-7a6 6 0 0 1-6-6z" fill="var(--ink)" />
      <path
        d="M23 11h2.5a4.5 4.5 0 0 1 0 9H23"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <rect x="6.5" y="9.5" width="14" height="3" rx="1" fill="var(--brand)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <MugMark className="size-7" />
      <span className="text-xl font-bold tracking-tight">Mugshot</span>
    </span>
  );
}
