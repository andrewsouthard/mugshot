import type { Ingredient } from "@/lib/drinks";
import { formatMeasure, type UnitSystem } from "@/lib/units";
import { Swatch } from "./swatch";
import { cn } from "@/lib/cn";

/**
 * The spec. Amounts sit in a fixed right-aligned mono column so a bartender
 * can scan down the numbers without reading the names.
 */
export function IngredientList({
  ingredients,
  system = "oz",
  scale = 1,
  className,
}: {
  ingredients: Ingredient[];
  system?: UnitSystem;
  scale?: number;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {ingredients.map((ing, i) => {
        const m = formatMeasure(ing, system, scale);
        return (
          <li
            key={i}
            className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 py-3"
          >
            <span className="measure text-right text-ink">
              <span className="text-lg font-semibold">{m.value}</span>
              {m.unit && (
                <span className="ml-1 text-xs text-ink-muted">{m.unit}</span>
              )}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-medium">
                <Swatch kind={ing.kind} />
                {ing.name}
              </span>
              {ing.note && (
                <span className="mt-0.5 block pl-[1.125rem] text-sm text-ink-muted">
                  {ing.note}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
