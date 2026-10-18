import { Document } from "flexsearch";
import type { ResolvedRecipe } from "../content/schema";
import { fuzzyMatches } from "./fuzzy";

type SearchDoc = {
  id: string;
  name: string;
  ingredients: string;
  tags: string;
  description: string;
};

type Field = Exclude<keyof SearchDoc, "id">;

/** Higher wins: name > ingredient names > tags > description. */
const WEIGHTS: Record<Field, number> = {
  name: 4,
  ingredients: 3,
  tags: 2,
  description: 1,
};

/** Scored below every indexed field, so typo matches rank last. */
const FUZZY_WEIGHT = 0.5;

/** Lowercase words with accents stripped: "Crème de cacao" → ["creme", "de", "cacao"]. */
export function words(text: string): string[] {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^\p{Letter}\p{Number}]+/u)
    .filter(Boolean);
}

/**
 * Builds the on-device search index. The returned function gives the IDs of
 * matching recipes, best first; an empty query matches everything.
 *
 * Every word of the query has to match some field. FlexSearch only matches
 * prefixes, so a word it finds nowhere falls back to a typo-tolerant match
 * against recipe and ingredient names.
 */
export function createRecipeSearch(recipes: ResolvedRecipe[]): (query: string) => string[] {
  const index = new Document<SearchDoc>({
    document: {
      id: "id",
      index: (Object.keys(WEIGHTS) as Field[]).map((field) => ({
        field,
        tokenize: "forward" as const,
        encoder: "Normalize" as const,
      })),
    },
  });

  const order = new Map<string, number>();
  const names = new Map<string, string[]>();
  recipes.forEach((recipe, position) => {
    const ingredients = recipe.ingredients.map((line) => line.name).join(" ");
    index.add({
      id: recipe.id,
      name: recipe.name,
      ingredients,
      tags: recipe.tags.join(" "),
      description: recipe.description,
    });
    order.set(recipe.id, position);
    names.set(recipe.id, words(`${recipe.name} ${ingredients}`));
  });

  return (query) => {
    const terms = words(query);
    if (terms.length === 0) return recipes.map((recipe) => recipe.id);

    let scores: Map<string, number> | undefined;
    for (const term of terms) {
      const termScores = new Map<string, number>();
      for (const { field, result } of index.search(term, { limit: recipes.length })) {
        const weight = WEIGHTS[field as Field];
        for (const id of result) {
          const key = String(id);
          termScores.set(key, Math.max(termScores.get(key) ?? 0, weight));
        }
      }
      if (termScores.size === 0) {
        for (const [id, recipeWords] of names) {
          if (fuzzyMatches(term, recipeWords)) termScores.set(id, FUZZY_WEIGHT);
        }
      }

      if (!scores) {
        scores = termScores;
      } else {
        const previous: Map<string, number> = scores;
        scores = new Map(
          [...termScores]
            .filter(([id]) => previous.has(id))
            .map(([id, score]) => [id, previous.get(id)! + score]),
        );
      }
      if (scores.size === 0) break;
    }

    return [...scores!]
      .sort(([a, scoreA], [b, scoreB]) => scoreB - scoreA || order.get(a)! - order.get(b)!)
      .map(([id]) => id);
  };
}
