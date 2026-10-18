import type { ResolvedRecipe } from "../content/schema";
import { formatIngredient, renderStepText } from "./format";

/** Amounts as written, so structured data matches the recipe file. */
const AS_WRITTEN = { scale: 1 };

/** A schema.org `Recipe` for the recipe page. */
export function recipeJsonLd(recipe: ResolvedRecipe, url: URL) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description,
    url: url.href,
    ...(recipe.illustration && {
      image: new URL(`/illustrations/${recipe.illustration}`, url).href,
    }),
    recipeCategory: recipe.type === "cocktail" ? "Cocktail" : "Coffee",
    cookingMethod: recipe.method,
    keywords: recipe.tags.join(", "),
    recipeYield: `${recipe.serves} ${recipe.serves === 1 ? "serving" : "servings"}`,
    recipeIngredient: recipe.ingredients.map((line) =>
      [
        formatIngredient(line, AS_WRITTEN),
        line.note,
        line.optional && "optional",
      ]
        .filter(Boolean)
        .join(", "),
    ),
    tool: recipe.equipment.map((name) => ({ "@type": "HowToTool", name })),
    recipeInstructions: recipe.steps.map((step) => ({
      "@type": "HowToStep",
      text: renderStepText(step.text, recipe.ingredients, AS_WRITTEN),
    })),
    ...(recipe.source.url && { isBasedOn: recipe.source.url }),
  };
}

/** JSON for a `<script>` tag, with `<` escaped so content can't close it. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
