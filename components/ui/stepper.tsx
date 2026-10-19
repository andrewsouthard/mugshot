"use client";

import { cn } from "cn";

/** − 2 + — for servings and batch sizes. */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 12,
  label,
  suffix,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  suffix?: (value: number) => string;
  className?: string;
}) {
  const btn =
    "flex size-8 items-center justify-center rounded-full text-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-sunken p-0.5",
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        −
      </button>
      <output aria-live="polite" className="measure min-w-16 text-center text-sm font-medium">
        {value}
        {suffix && <span className="ml-1 font-sans text-ink-muted">{suffix(value)}</span>}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        +
      </button>
    </div>
  );
}
