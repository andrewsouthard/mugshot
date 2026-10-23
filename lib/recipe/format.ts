import type {
  ResolvedIngredientLine,
  ResolvedRecipe,
  Target,
  Timer,
  Unit,
} from "../content/schema";

export type VolumeUnit = "oz" | "ml";
export type VolumeDisplay = VolumeUnit | "parts";
export const VOLUME_DISPLAYS = ["oz", "ml", "parts"] as const;
export type TemperatureUnit = "C" | "F";

export type DisplayOptions = {
  /** Chosen servings ÷ the recipe's `serves`. */
  scale: number;
  /**
   * Converts oz and ml amounts to this unit. Leave it out to show volumes as
   * written (coffee recipes, which are always in grams).
   */
  volume?: VolumeDisplay;
  /** Unscaled volume of one part, derived from the full recipe's ingredients. */
  partMl?: number;
};

// Parts are a display unit only; recipe content always stores real measures.
type Quantity = { amount?: number; unit: Unit | "part" };

/** Bar convention, not the exact 29.57, so specs round-trip cleanly. */
export const ML_PER_OZ = 30;

/** The base spirit is one part. Without a spirit, use the first required volume. */
export function partSizeMl(
  ingredients: ResolvedIngredientLine[],
): number | undefined {
  const volumes = ingredients.filter(
    (line) =>
      (line.unit === "oz" || line.unit === "ml") &&
      line.amount !== undefined &&
      line.amount > 0,
  );
  const base =
    volumes.find((line) => line.category === "spirit" && !line.optional) ??
    volumes.find((line) => !line.optional) ??
    volumes[0];
  return base && base.amount! * (base.unit === "oz" ? ML_PER_OZ : 1);
}

/** Common jigger fractions, including thirds and eighths, without volume rounding. */
function formatParts(value: number): string {
  const whole = Math.floor(value);
  const remainder = value - whole;
  if (remainder < 1e-8) return String(whole);
  for (const denominator of [2, 3, 4, 5, 6, 8, 10, 12, 16]) {
    const numerator = Math.round(remainder * denominator);
    if (
      numerator > 0 &&
      numerator < denominator &&
      Math.abs(remainder - numerator / denominator) < 1e-8
    ) {
      return `${whole ? `${whole} ` : ""}${numerator}/${denominator}`;
    }
  }
  return String(Number(value.toPrecision(6)));
}

const FRACTIONS: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" };

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Writes 1.5 as "1½". Anything that isn't a quarter falls back to decimals. */
function formatFraction(value: number): string {
  const whole = Math.floor(value);
  const rest = Math.round((value - whole) * 100) / 100;
  if (rest === 0) return String(whole);
  const glyph = FRACTIONS[rest];
  if (!glyph) return formatDecimal(value);
  return whole === 0 ? glyph : `${whole}${glyph}`;
}

function formatDecimal(value: number): string {
  return String(Math.round(value * 10) / 10);
}

/**
 * Scales a quantity and converts its volume unit, rounding to amounts you can
 * actually measure. Parts preserve the original proportions without volume
 * rounding. Quantities that are neither scaled nor converted stay as written.
 */
export function scaleQuantity(
  quantity: Quantity,
  { scale, volume, partMl }: DisplayOptions,
): Quantity {
  const { amount, unit } = quantity;
  if (amount === undefined) return quantity;

  if (
    volume === "parts" &&
    (unit === "oz" || unit === "ml") &&
    partMl &&
    partMl > 0
  ) {
    return {
      ...quantity,
      amount: (amount * (unit === "oz" ? ML_PER_OZ : 1) * scale) / partMl,
      unit: "part",
    };
  }

  const convertTo =
    (unit === "oz" || unit === "ml") &&
    (volume === "oz" || volume === "ml") &&
    volume !== unit
      ? volume
      : undefined;
  if (scale === 1 && !convertTo) return quantity;

  let value = amount * scale;
  let nextUnit = unit;
  if (convertTo) {
    value = convertTo === "ml" ? value * ML_PER_OZ : value / ML_PER_OZ;
    nextUnit = convertTo;
  }

  switch (nextUnit) {
    case "oz":
      value = Math.max(0.25, roundTo(value, 0.25));
      break;
    case "ml":
      value = Math.max(2.5, roundTo(value, value < 15 ? 2.5 : 5));
      break;
    case "dash":
      value = Math.max(1, Math.round(value));
      break;
    case "barspoon":
    case "piece":
      value = Math.max(0.5, roundTo(value, 0.5));
      break;
    case "g":
      value = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
      break;
  }

  return { ...quantity, amount: value, unit: nextUnit };
}

/**
 * The number and unit label separately, for layouts that set them apart.
 * Both are "" for to-taste; the label is "" for pieces.
 */
export function quantityParts({ amount, unit }: Quantity): {
  value: string;
  unit: string;
} {
  if (amount === undefined || unit === "to-taste")
    return { value: "", unit: "" };
  switch (unit) {
    case "part":
      return {
        value: formatParts(amount),
        unit: amount <= 1 ? "part" : "parts",
      };
    case "oz":
      return { value: formatFraction(amount), unit: "oz" };
    case "ml":
    case "g":
      return { value: formatDecimal(amount), unit };
    case "dash":
      return {
        value: formatDecimal(amount),
        unit: amount === 1 ? "dash" : "dashes",
      };
    case "barspoon":
      return {
        value: formatFraction(amount),
        unit: amount <= 1 ? "barspoon" : "barspoons",
      };
    case "piece":
      return { value: formatFraction(amount), unit: "" };
  }
}

/** "1½ oz", "25 ml", "2 dashes", "½ barspoon", "1" (pieces), "" (to taste). */
export function formatQuantity(quantity: Quantity): string {
  const { value, unit } = quantityParts(quantity);
  return unit ? `${value} ${unit}` : value;
}

/** "1½ oz cognac", "1 orange peel", "superfine sugar, to taste". */
export function formatIngredient(
  line: Quantity & { name: string },
  options: DisplayOptions,
): string {
  if (line.unit === "to-taste") return `${line.name}, to taste`;
  return `${formatQuantity(scaleQuantity(line, options))} ${line.name}`;
}

const PLACEHOLDER = /\{([^{}]+)\}/g;

/** Replaces `{ingredient-id}` placeholders with the scaled amount and name. */
export function renderStepText(
  text: string,
  ingredients: ResolvedIngredientLine[],
  options: DisplayOptions,
): string {
  return text.replace(PLACEHOLDER, (match, id: string) => {
    const line = ingredients.find((candidate) => candidate.ingredient === id);
    return line ? formatIngredient(line, options) : match;
  });
}

/** The ingredient line IDs a step's text refers to, in order. */
export function stepIngredientIds(text: string): string[] {
  return [...new Set(Array.from(text.matchAll(PLACEHOLDER), ([, id]) => id))];
}

/** "450 g water". Targets scale with servings. */
export function formatTarget(
  target: Target,
  ingredients: ResolvedIngredientLine[],
  options: DisplayOptions,
): string {
  const name =
    ingredients.find((line) => line.ingredient === target.ingredient)?.name ??
    target.ingredient;
  return formatIngredient({ ...target, name }, options);
}

/** "0:12", "4:00". Timers don't scale with servings. */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function describeTimer(timer: Timer): string {
  const duration = formatDuration(timer.seconds);
  return timer.kind === "countdown"
    ? `${duration} timer`
    : `Stopwatch, aim for ${duration}`;
}

export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit,
): string {
  const value = unit === "C" ? celsius : (celsius * 9) / 5 + 32;
  return `${Math.round(value)} °${unit}`;
}

/**
 * The brew ratio derived from the coffee and water weights, e.g. "1:15".
 * Null unless the recipe has exactly one of each, in grams.
 */
export function brewRatio(
  recipe: Pick<ResolvedRecipe, "ingredients">,
): string | null {
  const grams = (category: string) =>
    recipe.ingredients.filter(
      (line) => line.category === category && line.unit === "g",
    );
  const coffee = grams("coffee");
  const water = grams("water");
  if (coffee.length !== 1 || water.length !== 1) return null;
  const ratio = water[0].amount! / coffee[0].amount!;
  return `1:${formatDecimal(ratio)}`;
}
