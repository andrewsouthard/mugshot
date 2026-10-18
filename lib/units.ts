import type { Ingredient, IngredientKind, Unit } from "./drinks";

export type UnitSystem = "oz" | "ml";

/** Bar convention, not the exact 29.57 — specs round-trip cleanly. */
const ML_PER_OZ = 30;

const FRACTIONS: Record<number, string> = {
  0.25: "¼",
  0.5: "½",
  0.75: "¾",
};

const COUNT_UNITS: Partial<Record<Unit, [string, string]>> = {
  barspoon: ["barspoon", "barspoons"],
  dash: ["dash", "dashes"],
  drop: ["drop", "drops"],
  piece: ["", ""],
};

function roundTo(n: number, step: number) {
  return Math.round(n / step) * step;
}

/** 1.75 → "1 ¾", 0.5 → "½", 3 → "3" */
export function formatOunces(oz: number) {
  const q = Math.max(roundTo(oz, 0.25), oz > 0 ? 0.25 : 0);
  const whole = Math.floor(q);
  const frac = FRACTIONS[+(q - whole).toFixed(2)];
  if (!frac) return String(whole);
  return whole ? `${whole} ${frac}` : frac;
}

function formatMl(ml: number) {
  return String(roundTo(ml, ml < 60 ? 2.5 : 5));
}

function formatGrams(g: number) {
  return String(g < 10 ? roundTo(g, 0.5) : Math.round(g));
}

export type Measure = { value: string; unit: string };

/**
 * Render an ingredient amount for display. Weights (g) never convert —
 * coffee is weighed on a scale in every kitchen. Counts round to whole
 * numbers when scaled.
 */
export function formatMeasure(
  ing: Pick<Ingredient, "amount" | "unit">,
  system: UnitSystem = "oz",
  scale = 1,
): Measure {
  const { unit } = ing;
  if (unit === "top" || ing.amount === undefined) {
    return { value: "Top", unit: "" };
  }
  const n = ing.amount * scale;

  const count = COUNT_UNITS[unit];
  if (count) {
    const c = Math.max(1, Math.round(n));
    return { value: String(c), unit: c === 1 ? count[0] : count[1] };
  }

  switch (unit) {
    case "g":
      return { value: formatGrams(n), unit: "g" };
    case "oz":
      return system === "oz"
        ? { value: formatOunces(n), unit: "oz" }
        : { value: formatMl(n * ML_PER_OZ), unit: "ml" };
    case "ml":
      return system === "ml"
        ? { value: formatMl(n), unit: "ml" }
        : { value: formatOunces(n / ML_PER_OZ), unit: "oz" };
  }
  return { value: String(n), unit };
}

/** Approximate liquid volume, used to proportion the glass illustration. */
const NON_LIQUID: IngredientKind[] = ["garnish"];
export function volumeMl(ing: Ingredient) {
  if (NON_LIQUID.includes(ing.kind)) return 0;
  switch (ing.unit) {
    case "oz":
      return (ing.amount ?? 0) * ML_PER_OZ;
    case "ml":
    case "g":
      return ing.amount ?? 0;
    case "barspoon":
      return (ing.amount ?? 1) * 5;
    case "top":
      return 90;
    default:
      return 0; // dashes and drops are seasoning, not volume
  }
}

/** 18 → 36 → "1:2", 15 → 250 → "1:16.7" */
export function formatRatio(dose: number, out: number) {
  const r = out / dose;
  return `1:${Number.isInteger(r) ? r : r.toFixed(1)}`;
}

/** 45 → "45s", 150 → "2:30" */
export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** [24, 28] → "24–28s", [150, 180] → "2:30–3:00" */
export function formatDurationRange([lo, hi]: [number, number]) {
  if (hi < 60) return `${lo}–${hi}s`;
  return `${formatDuration(lo)}–${formatDuration(hi)}`;
}
