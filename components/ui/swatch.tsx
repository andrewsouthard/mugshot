import type { IngredientKind } from "@/lib/drinks";
import { cn } from "@/lib/cn";

export const liquidColor: Record<IngredientKind, string> = {
  spirit: "var(--liquid-spirit)",
  clear: "var(--liquid-clear)",
  liqueur: "var(--liquid-liqueur)",
  fortified: "var(--liquid-fortified)",
  citrus: "var(--liquid-citrus)",
  syrup: "var(--liquid-syrup)",
  bitters: "var(--liquid-bitters)",
  coffee: "var(--liquid-coffee)",
  milk: "var(--liquid-milk)",
  foam: "var(--liquid-foam)",
  water: "var(--liquid-water)",
  soda: "var(--liquid-soda)",
  garnish: "var(--success)",
};

/** A droplet of the ingredient's liquid color. */
export function Swatch({
  kind,
  className,
}: {
  kind: IngredientKind;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full ring-1 ring-ink/15 ring-inset",
        className,
      )}
      style={{ background: liquidColor[kind] }}
    />
  );
}
