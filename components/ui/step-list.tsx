import type { Step } from "@/lib/drinks";
import { formatDuration } from "@/lib/units";
import { cn } from "@/lib/cn";

export function StepList({
  steps,
  className,
}: {
  steps: Step[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-4", className)}>
      {steps.map((step, i) => (
        <li key={i} className="grid grid-cols-[2rem_1fr] gap-3">
          <span className="measure flex size-7 items-center justify-center rounded-full bg-ink text-xs text-paper">
            {i + 1}
          </span>
          <p className="pt-1 leading-relaxed">
            {step.text}
            {step.duration && (
              <span className="measure ml-2 inline-flex h-5 items-center gap-1 rounded-full bg-brand-wash px-2 align-[1px] text-xs text-ink">
                <TimerGlyph />
                {formatDuration(step.duration)}
              </span>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}

function TimerGlyph() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      <circle cx="6" cy="6.5" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 4v2.5l1.5 1M4.5 1h3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
