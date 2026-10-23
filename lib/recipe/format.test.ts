import { describe, expect, it } from "vitest";
import type { ResolvedIngredientLine } from "../content/schema";
import {
  brewRatio,
  describeTimer,
  formatIngredient,
  formatQuantity,
  formatTarget,
  formatTemperature,
  quantityParts,
  partSizeMl,
  renderStepText,
  scaleQuantity,
  stepIngredientIds,
} from "./format";

const asWritten = { scale: 1 };
const inOz = { scale: 1, volume: "oz" } as const;
const inMl = { scale: 1, volume: "ml" } as const;

function line(
  ingredient: string,
  amount: number | undefined,
  unit: ResolvedIngredientLine["unit"],
  category = "spirit",
): ResolvedIngredientLine {
  return {
    ingredient,
    amount,
    unit,
    name: ingredient.replace(/-/g, " "),
    category,
  };
}

const quantity = (
  options: Parameters<typeof scaleQuantity>[1],
  amount: number,
  unit: ResolvedIngredientLine["unit"],
) => formatQuantity(scaleQuantity({ amount, unit }, options));

describe("parts for a jigger", () => {
  const ingredients = [
    line("simple", 15, "ml", "sweetener"),
    line("rum", 1, "oz"),
    line("soda", 60, "ml", "soda"),
    line("bitters", 2, "dash", "bitters"),
    line("lime", 1, "piece", "garnish"),
  ];
  const options = {
    scale: 1,
    volume: "parts",
    partMl: partSizeMl(ingredients),
  } as const;

  it("uses the base spirit as one part, even when syrup comes first", () => {
    expect(options.partMl).toBe(30);
    expect(
      ingredients.map((ingredient) => formatIngredient(ingredient, options)),
    ).toEqual([
      "1/2 part simple",
      "1 part rum",
      "2 parts soda",
      "2 dashes bitters",
      "1 lime",
    ]);
  });

  it("scales parts and garnishes together for a batch", () => {
    const batch = { ...options, scale: 3 };
    expect(formatIngredient(ingredients[0], batch)).toBe("1 1/2 parts simple");
    expect(formatIngredient(ingredients[1], batch)).toBe("3 parts rum");
    expect(formatIngredient(ingredients[3], batch)).toBe("6 dashes bitters");
    expect(formatIngredient(ingredients[4], batch)).toBe("3 lime");
  });

  it("preserves thirds, eighths and small amounts without oz/ml rounding", () => {
    expect(quantity(options, 10, "ml")).toBe("1/3 part");
    expect(quantity(options, 0.375, "oz")).toBe("3/8 part");
    expect(quantity(options, 0.1, "ml")).toBe("0.00333333 part");
    expect(quantity(options, 22, "ml")).toBe("0.733333 part");
  });

  it("uses one recipe-wide basis for step placeholders and pour targets", () => {
    expect(
      renderStepText("Add {simple}, {rum} and {soda}.", ingredients, options),
    ).toBe("Add 1/2 part simple, 1 part rum and 2 parts soda.");
    expect(
      formatTarget(
        { ingredient: "soda", amount: 60, unit: "ml" },
        ingredients,
        options,
      ),
    ).toBe("2 parts soda");
  });

  it("doesn't convert weights, seasoning or to-taste ingredients", () => {
    expect(quantity(options, 30, "g")).toBe("30 g");
    expect(quantity(options, 0.5, "barspoon")).toBe("½ barspoon");
    expect(
      formatIngredient(line("sugar", undefined, "to-taste"), options),
    ).toBe("sugar, to taste");
  });

  it("falls back to a required volume for spirit-free recipes, ignoring optional spirits", () => {
    const optionalSpirit = { ...line("rum", 2, "oz"), optional: true };
    expect(partSizeMl([optionalSpirit, line("juice", 45, "ml", "juice")])).toBe(
      45,
    );
    expect(partSizeMl([line("coffee", 30, "g", "coffee")])).toBeUndefined();
  });
});

describe("scaling and units", () => {
  it("shows oz as quarter fractions", () => {
    expect(quantity(inOz, 1.5, "oz")).toBe("1½ oz");
    expect(quantity(inOz, 0.75, "oz")).toBe("¾ oz");
    expect(quantity(inOz, 2, "oz")).toBe("2 oz");
    expect(quantity({ scale: 3, volume: "oz" }, 0.75, "oz")).toBe("2¼ oz");
  });

  it("converts oz to ml, rounding to 5 ml, or 2.5 ml below 15 ml", () => {
    expect(quantity(inMl, 1.5, "oz")).toBe("45 ml");
    expect(quantity(inMl, 0.75, "oz")).toBe("25 ml");
    expect(quantity(inMl, 0.25, "oz")).toBe("7.5 ml");
    expect(quantity(inMl, 0.1, "oz")).toBe("2.5 ml");
  });

  it("converts ml to the nearest quarter oz", () => {
    expect(quantity(inOz, 45, "ml")).toBe("1½ oz");
    expect(quantity(inOz, 20, "ml")).toBe("¾ oz");
    expect(quantity(inOz, 5, "ml")).toBe("¼ oz");
  });

  it("scales by servings ÷ serves", () => {
    expect(quantity({ scale: 2 }, 450, "g")).toBe("900 g");
    expect(quantity({ scale: 2, volume: "ml" }, 0.75, "oz")).toBe("45 ml");
    expect(quantity({ scale: 0.5, volume: "oz" }, 0.75, "oz")).toBe("½ oz");
  });

  it("leaves amounts that aren't scaled or converted as written", () => {
    expect(quantity(asWritten, 22, "ml")).toBe("22 ml");
    expect(quantity(asWritten, 0.75, "oz")).toBe("¾ oz");
    expect(quantity(asWritten, 7.5, "g")).toBe("7.5 g");
  });

  it("rounds dashes to whole dashes, at least 1", () => {
    expect(quantity({ scale: 1.5 }, 3, "dash")).toBe("5 dashes");
    expect(quantity({ scale: 0.25 }, 1, "dash")).toBe("1 dash");
  });

  it("rounds barspoons to the nearest ½", () => {
    expect(quantity({ scale: 3 }, 0.5, "barspoon")).toBe("1½ barspoons");
    expect(quantity({ scale: 0.5 }, 1, "barspoon")).toBe("½ barspoon");
    expect(quantity({ scale: 2 }, 0.5, "barspoon")).toBe("1 barspoon");
  });

  it("doesn't convert grams", () => {
    expect(quantity(inMl, 30, "g")).toBe("30 g");
  });
});

describe("quantityParts", () => {
  it("splits the number from the unit label", () => {
    expect(quantityParts({ amount: 1.5, unit: "oz" })).toEqual({
      value: "1½",
      unit: "oz",
    });
    expect(quantityParts({ amount: 2, unit: "dash" })).toEqual({
      value: "2",
      unit: "dashes",
    });
    expect(quantityParts({ amount: 1, unit: "piece" })).toEqual({
      value: "1",
      unit: "",
    });
    expect(quantityParts({ unit: "to-taste" })).toEqual({
      value: "",
      unit: "",
    });
  });
});

describe("formatIngredient", () => {
  it("renders each kind of unit", () => {
    expect(formatIngredient(line("cognac", 1.5, "oz"), inOz)).toBe(
      "1½ oz cognac",
    );
    expect(formatIngredient(line("water", 450, "g"), asWritten)).toBe(
      "450 g water",
    );
    expect(
      formatIngredient(line("angostura-bitters", 2, "dash"), asWritten),
    ).toBe("2 dashes angostura bitters");
    expect(formatIngredient(line("orange-peel", 1, "piece"), asWritten)).toBe(
      "1 orange peel",
    );
    expect(
      formatIngredient(
        line("superfine-sugar", undefined, "to-taste"),
        asWritten,
      ),
    ).toBe("superfine sugar, to taste");
  });
});

describe("step text", () => {
  const ingredients = [
    line("cognac", 1.5, "oz"),
    line("lemon-juice", 0.75, "oz", "juice"),
    line("water", 450, "g", "water"),
  ];

  it("replaces placeholders with scaled, converted amounts", () => {
    expect(
      renderStepText("Add {cognac} and {lemon-juice}.", ingredients, {
        scale: 2,
        volume: "ml",
      }),
    ).toBe("Add 90 ml cognac and 45 ml lemon juice.");
  });

  it("lists the ingredients a step refers to", () => {
    expect(stepIngredientIds("{cognac}, {water} and {cognac}")).toEqual([
      "cognac",
      "water",
    ]);
  });

  it("scales targets", () => {
    expect(
      formatTarget(
        { ingredient: "water", amount: 450, unit: "g" },
        ingredients,
        { scale: 2 },
      ),
    ).toBe("900 g water");
  });
});

describe("timers", () => {
  it("describes countdowns and stopwatches", () => {
    expect(
      describeTimer({ kind: "countdown", seconds: 12, autoStart: false }),
    ).toBe("0:12 timer");
    expect(
      describeTimer({ kind: "stopwatch", seconds: 210, autoStart: false }),
    ).toBe("Stopwatch, aim for 3:30");
  });
});

describe("coffee", () => {
  it("converts water temperature", () => {
    expect(formatTemperature(95, "C")).toBe("95 °C");
    expect(formatTemperature(95, "F")).toBe("203 °F");
  });

  it("derives the brew ratio from coffee and water weights", () => {
    expect(
      brewRatio({
        ingredients: [
          line("coffee-beans", 30, "g", "coffee"),
          line("water", 450, "g", "water"),
        ],
      }),
    ).toBe("1:15");
    expect(
      brewRatio({
        ingredients: [
          line("coffee-beans", 18, "g", "coffee"),
          line("water", 300, "g", "water"),
        ],
      }),
    ).toBe("1:16.7");
    expect(brewRatio({ ingredients: [line("cognac", 1.5, "oz")] })).toBeNull();
  });
});
