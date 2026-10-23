import { cn } from "cn";
import type { ResolvedIngredientLine } from "@/lib/content/schema";
import { quantityParts, scaleQuantity, type DisplayOptions } from "@/lib/recipe/format";
import { Badge } from "./badge";
import { Swatch } from "./swatch";

/**
 * The spec. Amounts sit in a fixed right-aligned mono column so a bartender
 * can scan down the numbers without reading the names.
 */
export function IngredientList({
  ingredients,
  options = { scale: 1 },
  className,
}: {
  ingredients: ResolvedIngredientLine[];
  options?: DisplayOptions;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {ingredients.map((line) => {
        const m = quantityParts(scaleQuantity(line, options));
        const note =
          line.unit === "to-taste"
            ? ["to taste", line.note].filter(Boolean).join(", ")
            : line.note;
        return (
          <li
            key={line.ingredient}
            className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 py-3"
          >
            <span className="measure text-right text-ink">
              <span className="text-lg font-semibold">{m.value}</span>
              {m.unit && (
                <span className="ml-1 text-xs text-ink-muted">{m.unit}</span>
              )}
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                <Swatch category={line.category} />
                <span className="inline-block first-letter:uppercase">{line.name}</span>
                {line.optional && <Badge variant="outline">optional</Badge>}
              </span>
              {note && (
                <span className="mt-0.5 block pl-[1.125rem] text-sm text-ink-muted">
                  {note}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
