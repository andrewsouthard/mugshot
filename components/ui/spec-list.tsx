import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Key/value facts: glass, ice, garnish, time. */
export function SpecList({
  items,
  className,
}: {
  items: Array<[string, ReactNode]>;
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4", className)}>
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="eyebrow">{label}</dt>
          <dd className="mt-1 text-sm font-medium first-letter:uppercase">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
