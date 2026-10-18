import type { ReactNode } from "react";
import type { BrewSpec } from "@/lib/drinks";
import { formatDurationRange, formatRatio } from "@/lib/units";
import { cn } from "@/lib/cn";

/** A single dial-in number. */
export function Stat({
  label,
  value,
  unit,
  emphasis,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-control border px-4 py-3",
        emphasis
          ? "border-brand bg-brand-wash"
          : "border-line bg-surface",
        className,
      )}
    >
      <div className="eyebrow">{label}</div>
      <div className="measure mt-1 text-2xl font-medium">
        {value}
        {unit && <span className="ml-1 text-sm opacity-60">{unit}</span>}
      </div>
    </div>
  );
}

/** Barista parameters: dose → yield, ratio, time, temperature, grind. */
export function BrewSpecGrid({
  brew,
  className,
}: {
  brew: BrewSpec;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      <Stat label="Dose" value={brew.dose} unit="g" />
      <Stat label="Yield" value={brew.yield} unit="g" />
      <Stat label="Ratio" value={formatRatio(brew.dose, brew.yield)} emphasis />
      {brew.time && (
        <Stat
          label="Time"
          value={formatDurationRange(brew.time)}
        />
      )}
      {brew.temp && <Stat label="Temp" value={brew.temp} unit="°C" />}
      {brew.grind && (
        <Stat
          label="Grind"
          value={<span className="font-sans text-base">{brew.grind}</span>}
        />
      )}
    </div>
  );
}
