import { describe, expect, it } from "vitest";
import { loadRecipeBundle } from "./load";
import { ContentError, validateContent, type RecipeFile } from "./validate";

const catalog = [
  { id: "gin", name: "gin", category: "spirit" },
  { id: "lime-juice", name: "lime juice", category: "juice" },
];

function recipe(overrides: Record<string, unknown> = {}) {
  return {
    id: "gimlet",
    name: "Gimlet",
    type: "cocktail",
    description: "Gin and lime.",
    tags: ["sour"],
    serves: 1,
    method: "shake",
    equipment: ["shaker"],
    ingredients: [
      { ingredient: "gin", amount: 2, unit: "oz" },
      { ingredient: "lime-juice", amount: 0.75, unit: "oz" },
    ],
    steps: [{ text: "Shake {gin} and {lime-juice} with ice." }],
    illustration: null,
    source: { name: "Test" },
    ...overrides,
  };
}

function file(data: Record<string, unknown>, fileName = `${data.id}.json`): RecipeFile {
  return { fileName, data };
}

function issuesFor(catalogData: unknown, files: RecipeFile[]): string[] {
  try {
    validateContent(catalogData, files);
  } catch (error) {
    if (error instanceof ContentError) return error.issues;
    throw error;
  }
  return [];
}

describe("validateContent", () => {
  it("resolves ingredient lines against the catalog", () => {
    const { recipes } = validateContent(catalog, [file(recipe())]);
    expect(recipes[0].ingredients[1]).toEqual({
      ingredient: "lime-juice",
      amount: 0.75,
      unit: "oz",
      name: "lime juice",
      category: "juice",
    });
  });

  it("rejects ingredients missing from the catalog", () => {
    const issues = issuesFor(catalog, [
      file(recipe({
        ingredients: [{ ingredient: "rum", amount: 2, unit: "oz" }],
        steps: [{ text: "Pour {rum}." }],
      })),
    ]);
    expect(issues).toEqual([
      'recipes/gimlet.json: ingredient "rum" isn\'t in the catalog',
    ]);
  });

  it("rejects placeholders and targets that don't resolve", () => {
    const issues = issuesFor(catalog, [
      file(recipe({
        steps: [
          { text: "Add {gin} and {simple-syrup}." },
          { text: "Pour.", target: { ingredient: "water", amount: 100, unit: "g" } },
        ],
      })),
    ]);
    expect(issues).toEqual([
      "recipes/gimlet.json: step 1 placeholder {simple-syrup} isn't one of the recipe's ingredients",
      'recipes/gimlet.json: step 2 target "water" isn\'t one of the recipe\'s ingredients',
    ]);
  });

  it("rejects IDs that don't match the file name, and duplicates", () => {
    const issues = issuesFor(catalog, [
      file(recipe(), "gimlet.json"),
      file(recipe(), "gimlet-copy.json"),
    ]);
    expect(issues).toEqual([
      'recipes/gimlet-copy.json: ID "gimlet" doesn\'t match the file name',
      'recipes/gimlet-copy.json: duplicate recipe ID "gimlet"',
    ]);
  });

  it("rejects duplicate catalog IDs", () => {
    const issues = issuesFor([...catalog, catalog[0]], [file(recipe())]);
    expect(issues).toEqual(['ingredients.json: duplicate ingredient ID "gin"']);
  });

  it("requires an amount except for to-taste", () => {
    const issues = issuesFor(catalog, [
      file(recipe({
        ingredients: [
          { ingredient: "gin", unit: "oz" },
          { ingredient: "lime-juice", amount: 1, unit: "to-taste" },
        ],
        steps: [{ text: "Mix." }],
      })),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/ingredients\[0\]\.amount/);
    expect(issues[0]).toMatch(/ingredients\[1\]\.amount/);
  });

  it("rejects unknown fields", () => {
    const issues = issuesFor(catalog, [
      file(recipe({ brew: { ratio: 15, waterTempC: 95, grind: "fine" } })),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatch(/ratio/);
  });

  it("reports every problem at once", () => {
    const issues = issuesFor(catalog, [
      file(recipe({ serves: 0 })),
      file(recipe({ id: "gimlet-2", steps: [{ text: "{nope}" }] })),
    ]);
    expect(issues).toHaveLength(2);
  });
});

describe("loadRecipeBundle", () => {
  it("loads the real content", () => {
    const bundle = loadRecipeBundle();
    expect(bundle.hash).toMatch(/^[0-9a-f]{12}$/);
    expect(bundle.recipes.map((r) => r.id)).toEqual(["french-press", "sidecar"]);
  });
});
