import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { RecipeBundle, ResolvedRecipe } from "./schema";
import { ContentError, validateContent, type RecipeFile } from "./validate";

const CONTENT_DIR = path.join(process.cwd(), "content");

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    const relative = path.relative(CONTENT_DIR, file);
    throw new ContentError([`${relative}: ${(error as Error).message}`]);
  }
}

/**
 * Reads and checks everything under `content/`. Runs at build time only;
 * any problem throws, which fails the build.
 */
export function loadRecipeBundle(contentDir = CONTENT_DIR): RecipeBundle {
  const recipesDir = path.join(contentDir, "recipes");
  const recipeFiles: RecipeFile[] = readdirSync(recipesDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => ({
      fileName,
      data: readJson(path.join(recipesDir, fileName)),
    }));

  const { recipes } = validateContent(
    readJson(path.join(contentDir, "ingredients.json")),
    recipeFiles,
  );

  const hash = createHash("sha256")
    .update(JSON.stringify(recipes))
    .digest("hex")
    .slice(0, 12);

  return { hash, recipes };
}

let cached: RecipeBundle | undefined;

/** The recipe bundle, loaded once per build. */
export function getRecipeBundle(): RecipeBundle {
  cached ??= loadRecipeBundle();
  return cached;
}

export function getRecipe(id: string): ResolvedRecipe | undefined {
  return getRecipeBundle().recipes.find((recipe) => recipe.id === id);
}
