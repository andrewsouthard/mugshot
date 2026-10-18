import { cn } from "cn";

export const liquids = [
  "spirit",
  "clear",
  "liqueur",
  "fortified",
  "citrus",
  "syrup",
  "bitters",
  "coffee",
  "milk",
  "foam",
  "water",
  "soda",
] as const;

export type Liquid = (typeof liquids)[number];

/**
 * Ingredient categories (from `content/ingredients.json`) that don't share a
 * name with their liquid. Anything else unknown falls back to `spirit`.
 */
const CATEGORY_LIQUID: Record<string, Liquid> = {
  juice: "citrus",
  sweetener: "syrup",
};

/** The liquid-* token for an ingredient category. */
export function liquidColor(category: string): string {
  if (category === "garnish") return "var(--success)";
  const liquid =
    CATEGORY_LIQUID[category] ??
    (liquids.includes(category as Liquid) ? (category as Liquid) : "spirit");
  return `var(--liquid-${liquid})`;
}

/** A droplet of the ingredient's liquid color. */
export function Swatch({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-full ring-1 ring-ink/15 ring-inset",
        className,
      )}
      style={{ background: liquidColor(category) }}
    />
  );
}
