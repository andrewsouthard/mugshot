"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/** Radio group styled as a pill switch — units, modes, filters. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex rounded-full border border-line bg-sunken p-0.5",
        className,
      )}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            "relative cursor-pointer rounded-full font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand",
            size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3.5 py-1 text-sm",
            value === opt.value
              ? "bg-ink text-paper"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
