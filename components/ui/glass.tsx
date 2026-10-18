import { useId } from "react";
import { cn } from "cn";
import type { ResolvedIngredientLine, ResolvedRecipe } from "@/lib/content/schema";
import { ML_PER_OZ } from "@/lib/recipe/format";
import { liquidColor } from "./swatch";

export type GlassName =
  | "coupe"
  | "nick-and-nora"
  | "martini"
  | "rocks"
  | "highball"
  | "mug"
  | "cup"
  | "latte";

export type Ice = "cubed" | "large cube" | "crushed" | "none";

export const glassLabel: Record<GlassName, string> = {
  coupe: "Coupe",
  "nick-and-nora": "Nick & Nora",
  martini: "Martini",
  rocks: "Rocks",
  highball: "Highball",
  mug: "Mug",
  cup: "Cup & saucer",
  latte: "Latte glass",
};

function isGlassName(glass: string | undefined): glass is GlassName {
  return glass !== undefined && glass in glassLabel;
}

/**
 * Glassware drawn on a 64×80 grid. `outline` is stroked; `bowl` is the
 * interior used to clip liquid; liquid fills from `bottom` up toward `top`.
 */
type Geometry = { outline: string; bowl: string; top: number; bottom: number };

const GLASSES: Record<GlassName, Geometry> = {
  coupe: {
    outline: "M8 18 H56 Q56 40 32 42 Q8 40 8 18 Z M32 42 V69 M21 70 H43",
    bowl: "M10 20 H54 Q54 38 32 40 Q10 38 10 20 Z",
    top: 21,
    bottom: 40,
  },
  "nick-and-nora": {
    outline: "M16 12 H48 Q48 40 32 42 Q16 40 16 12 Z M32 42 V69 M22 70 H42",
    bowl: "M18 14 H46 Q46 38 32 40 Q18 38 18 14 Z",
    top: 17,
    bottom: 40,
  },
  martini: {
    outline: "M6 12 H58 L32 44 Z M32 44 V69 M21 70 H43",
    bowl: "M10 14 H54 L32 41 Z",
    top: 15,
    bottom: 41,
  },
  rocks: {
    outline: "M13 24 H51 L49 70 Q49 72 47 72 H17 Q15 72 15 70 Z",
    bowl: "M15.2 26 H48.8 L47.3 65 H16.7 Z",
    top: 30,
    bottom: 65,
  },
  highball: {
    outline: "M19 6 H45 L43.5 72 H20.5 Z",
    bowl: "M21 8 H43 L41.7 66 H22.3 Z",
    top: 12,
    bottom: 66,
  },
  latte: {
    outline: "M16 14 H48 L45 72 H19 Z",
    bowl: "M18 16 H46 L43.4 66 H20.6 Z",
    top: 19,
    bottom: 66,
  },
  mug: {
    outline:
      "M11 22 H47 V64 Q47 72 39 72 H19 Q11 72 11 64 Z M47 31 Q59 31 59 43 Q59 55 47 55",
    bowl: "M13 24 H45 V63.5 Q45 70 38.5 70 H19.5 Q13 70 13 63.5 Z",
    top: 29,
    bottom: 70,
  },
  cup: {
    outline:
      "M15 34 H49 L47 57 Q46 64 38 64 H26 Q18 64 17 57 Z M48.4 40 Q57 40 57 47 Q57 54 47 54 M7 68 H57",
    bowl: "M17.2 36 H46.8 L45 56.5 Q44.3 62 38 62 H26 Q19.7 62 19 56.5 Z",
    top: 38,
    bottom: 62,
  },
};

export type Layer = { color: string; ml: number; label?: string };

/** Approximate liquid volume. Dashes and pieces are seasoning, not volume. */
function volumeMl({ amount = 0, unit, category }: ResolvedIngredientLine) {
  if (category === "garnish") return 0;
  switch (unit) {
    case "oz":
      return amount * ML_PER_OZ;
    case "ml":
    case "g":
      return amount;
    case "barspoon":
      return amount * 5;
    default:
      return 0;
  }
}

/** Layers from an ingredient list, bottom of the glass first. */
export function layersFor(ingredients: ResolvedIngredientLine[]): Layer[] {
  return ingredients
    .map((line) => ({
      color: liquidColor(line.category),
      ml: volumeMl(line),
      label: line.name,
    }))
    .filter((l) => l.ml > 0);
}

/**
 * The house illustration: a glass silhouette with each ingredient stacked
 * as a band proportional to its volume. Works at 24px (icon) up to hero size.
 */
export function GlassFill({
  glass,
  layers = [],
  level = 0.85,
  ice,
  size = 96,
  title,
  className,
}: {
  glass: GlassName;
  layers?: Layer[];
  /** 0–1, how far from bottom to top the liquid reaches */
  level?: number;
  ice?: Ice;
  size?: number;
  title?: string;
  className?: string;
}) {
  const id = useId();
  const g = GLASSES[glass];
  const total = layers.reduce((sum, l) => sum + l.ml, 0);
  const span = (g.bottom - g.top) * Math.min(1, Math.max(0, level));

  const heights = layers.map((l) => (total ? (l.ml / total) * span : 0));
  const bands = layers.map((l, i) => {
    const below = heights.slice(0, i + 1).reduce((a, b) => a + b, 0);
    return (
      <rect
        key={i}
        x={0}
        y={g.bottom - below}
        width={64}
        height={heights[i] + 0.4}
        fill={l.color}
      />
    );
  });
  const surface = g.bottom - span;

  return (
    <svg
      viewBox="0 0 64 80"
      width={size}
      height={(size * 80) / 64}
      role="img"
      aria-label={title ?? `${glassLabel[glass]} glass`}
      className={cn("shrink-0 overflow-visible", className)}
    >
      <defs>
        <clipPath id={`${id}-bowl`}>
          <path d={g.bowl} />
        </clipPath>
      </defs>
      <path d={g.bowl} fill="var(--sunken)" opacity={0.55} />
      <g clipPath={`url(#${id}-bowl)`}>
        {bands}
        {total > 0 && (
          <rect
            x={0}
            y={surface}
            width={64}
            height={0.9}
            fill="white"
            opacity={0.45}
          />
        )}
        {ice && ice !== "none" && <Ice kind={ice} g={g} surface={surface} />}
      </g>
      <path
        d={g.outline}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Ice({
  kind,
  g,
  surface,
}: {
  kind: Ice;
  g: Geometry;
  surface: number;
}) {
  const props = {
    fill: "white",
    fillOpacity: 0.18,
    stroke: "white",
    strokeOpacity: 0.7,
    strokeWidth: 1,
  };
  if (kind === "large cube") {
    const s = Math.min(26, g.bottom - g.top - 4);
    return (
      <rect x={32 - s / 2} y={surface - 4} width={s} height={s} rx={3} {...props} />
    );
  }
  if (kind === "crushed") {
    return (
      <g {...props}>
        {Array.from({ length: 14 }, (_, i) => (
          <circle
            key={i}
            cx={20 + ((i * 7) % 24)}
            cy={surface + 2 + ((i * 5) % 22)}
            r={2.2}
          />
        ))}
      </g>
    );
  }
  return (
    <g {...props}>
      <rect x={23} y={surface - 3} width={10} height={10} rx={2} transform={`rotate(-8 28 ${surface + 2})`} />
      <rect x={32} y={surface + 6} width={10} height={10} rx={2} transform={`rotate(10 37 ${surface + 11})`} />
      <rect x={24} y={surface + 15} width={10} height={10} rx={2} transform={`rotate(4 29 ${surface + 20})`} />
    </g>
  );
}

/**
 * A recipe's glass, pre-filled with its ingredients. Coffee goes in as beans
 * and water but comes out as coffee, so it's drawn as one coffee layer.
 * Unknown or missing glasses fall back to a mug for coffee, rocks otherwise.
 */
export function RecipeGlass({
  recipe,
  size,
  className,
}: {
  recipe: Pick<ResolvedRecipe, "name" | "type" | "glass" | "ingredients">;
  size?: number;
  className?: string;
}) {
  const glass = isGlassName(recipe.glass)
    ? recipe.glass
    : recipe.type === "coffee"
      ? "mug"
      : "rocks";
  const layers = layersFor(recipe.ingredients);
  return (
    <GlassFill
      glass={glass}
      layers={
        recipe.type === "coffee"
          ? [{ color: liquidColor("coffee"), ml: layers.reduce((sum, l) => sum + l.ml, 0) }]
          : layers
      }
      size={size}
      title={`${recipe.name} in a ${glassLabel[glass].toLowerCase()} glass`}
      className={className}
    />
  );
}

export const glassNames = Object.keys(GLASSES) as GlassName[];
