import { describe, expect, it } from "vitest";
import { loadRecipeBundle } from "../content/load";
import { recipeJsonLd, serializeJsonLd } from "./json-ld";

const { recipes } = loadRecipeBundle();
const sidecar = recipes.find((recipe) => recipe.id === "sidecar")!;

describe("recipeJsonLd", () => {
  it("describes the recipe with amounts as written", () => {
    const data = recipeJsonLd(sidecar, new URL("https://example.com/recipes/sidecar"));
    expect(data).toMatchObject({
      "@type": "Recipe",
      name: "Sidecar",
      url: "https://example.com/recipes/sidecar",
      recipeCategory: "Cocktail",
      recipeYield: "1 serving",
    });
    expect(data.recipeIngredient).toContain("¾ oz lemon juice, freshly squeezed");
    expect(data.recipeIngredient).toContain("superfine sugar, to taste, for the rim, optional");
    expect(data.recipeInstructions[2].text).toBe(
      "Add 1½ oz cognac, ¾ oz Cointreau and ¾ oz lemon juice to the shaker.",
    );
    expect(data).not.toHaveProperty("image");
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so content can't close the script tag", () => {
    expect(serializeJsonLd({ text: "</script>" })).toBe('{"text":"\\u003c/script>"}');
  });
});
