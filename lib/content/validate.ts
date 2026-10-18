import { z } from "zod";
import {
  ingredientCatalogSchema,
  recipeSchema,
  type Ingredient,
  type ResolvedRecipe,
} from "./schema";

/** A recipe file as read from `content/recipes/`, before parsing. */
export type RecipeFile = { fileName: string; data: unknown };

const PLACEHOLDER = /\{([^{}]+)\}/g;

export class ContentError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid content:\n${issues.map((issue) => `- ${issue}`).join("\n")}`);
    this.name = "ContentError";
  }
}

/**
 * Checks the ingredient catalog and every recipe, and resolves each recipe's
 * ingredient lines against the catalog. Collects every problem before
 * throwing, so one build reports them all.
 */
export function validateContent(
  catalogData: unknown,
  recipeFiles: RecipeFile[],
): { ingredients: Ingredient[]; recipes: ResolvedRecipe[] } {
  const issues: string[] = [];

  const catalogResult = ingredientCatalogSchema.safeParse(catalogData);
  if (!catalogResult.success) {
    issues.push(`ingredients.json: ${z.prettifyError(catalogResult.error)}`);
  }
  const ingredients = catalogResult.data ?? [];

  const catalog = new Map<string, Ingredient>();
  for (const ingredient of ingredients) {
    if (catalog.has(ingredient.id)) {
      issues.push(`ingredients.json: duplicate ingredient ID "${ingredient.id}"`);
    }
    catalog.set(ingredient.id, ingredient);
  }

  const recipes: ResolvedRecipe[] = [];
  const seenIds = new Set<string>();

  for (const { fileName, data } of recipeFiles) {
    const where = `recipes/${fileName}`;
    const result = recipeSchema.safeParse(data);
    if (!result.success) {
      issues.push(`${where}: ${z.prettifyError(result.error)}`);
      continue;
    }
    const recipe = result.data;

    if (fileName !== `${recipe.id}.json`) {
      issues.push(`${where}: ID "${recipe.id}" doesn't match the file name`);
    }
    if (seenIds.has(recipe.id)) {
      issues.push(`${where}: duplicate recipe ID "${recipe.id}"`);
    }
    seenIds.add(recipe.id);

    const lineIds = new Set(recipe.ingredients.map((line) => line.ingredient));
    for (const line of recipe.ingredients) {
      if (!catalog.has(line.ingredient)) {
        issues.push(`${where}: ingredient "${line.ingredient}" isn't in the catalog`);
      }
    }

    recipe.steps.forEach((step, index) => {
      const stepName = `step ${index + 1}`;
      for (const [, id] of step.text.matchAll(PLACEHOLDER)) {
        if (!lineIds.has(id)) {
          issues.push(`${where}: ${stepName} placeholder {${id}} isn't one of the recipe's ingredients`);
        }
      }
      if (step.target && !lineIds.has(step.target.ingredient)) {
        issues.push(`${where}: ${stepName} target "${step.target.ingredient}" isn't one of the recipe's ingredients`);
      }
    });

    recipes.push({
      ...recipe,
      ingredients: recipe.ingredients.map((line) => {
        const { name = line.ingredient, category = "" } =
          catalog.get(line.ingredient) ?? {};
        return { ...line, name, category };
      }),
    });
  }

  if (issues.length > 0) throw new ContentError(issues);
  return { ingredients, recipes };
}
