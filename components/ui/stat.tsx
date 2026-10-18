import type { ReactNode } from "react";
import { cn } from "cn";
import type { ResolvedRecipe } from "@/lib/content/schema";
import {
  brewRatio,
  formatTemperature,
  type TemperatureUnit,
} from "@/lib/recipe/format";

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

/** Barista parameters: dose, water, ratio, temperature, grind. */
export function BrewSpecGrid({
  recipe,
  temperature = "C",
  className,
}: {
  recipe: Pick<ResolvedRecipe, "brew" | "ingredients">;
  temperature?: TemperatureUnit;
  className?: string;
}) {
  const { brew, ingredients } = recipe;
  if (!brew) return null;
  const grams = (category: string) =>
    ingredients.find((line) => line.category === category && line.unit === "g")?.amount;
  const dose = grams("coffee");
  const water = grams("water");
  const ratio = brewRatio(recipe);
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
      {dose !== undefined && <Stat label="Dose" value={dose} unit="g" />}
      {water !== undefined && <Stat label="Water" value={water} unit="g" />}
      {ratio && <Stat label="Ratio" value={ratio} emphasis />}
      <Stat label="Temp" value={formatTemperature(brew.waterTempC, temperature)} />
      <Stat
        label="Grind"
        value={<span className="inline-block font-sans text-base first-letter:uppercase">{brew.grind}</span>}
      />
    </div>
  );
}
