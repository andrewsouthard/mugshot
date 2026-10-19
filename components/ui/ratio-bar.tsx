import { cn } from "cn";
import type { ResolvedIngredientLine } from "@/lib/content/schema";
import { layersFor } from "./glass";

/** Proportions at a glance — the shape of a drink, independent of glass. */
export function RatioBar({
  ingredients,
  showLegend = true,
  className,
}: {
  ingredients: ResolvedIngredientLine[];
  showLegend?: boolean;
  className?: string;
}) {
  const layers = layersFor(ingredients);
  const total = layers.reduce((s, l) => s + l.ml, 0);
  return (
    <figure className={cn("space-y-2", className)}>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {layers.map((l, i) => (
          <div
            key={i}
            style={{ flexGrow: l.ml, background: l.color }}
            title={l.label}
          />
        ))}
      </div>
      {showLegend && (
        <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
          {layers.map((l, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: l.color }}
              />
              {l.label}
              <span className="measure text-ink-faint">
                {Math.round((l.ml / total) * 100)}%
              </span>
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
