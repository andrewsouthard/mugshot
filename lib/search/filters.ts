import type { ResolvedRecipe } from "../content/schema";

export const FACETS = ["type", "method", "glass", "tag"] as const;
export type Facet = (typeof FACETS)[number];

/** Selected values per facet. Values within a facet are OR'd, facets are AND'd. */
export type Filters = Record<Facet, string[]>;

export type SearchState = { query: string; filters: Filters };

export const FACET_LABELS: Record<Facet, string> = {
  type: "Type",
  method: "Method",
  glass: "Glass",
  tag: "Tags",
};

export function emptyFilters(): Filters {
  return { type: [], method: [], glass: [], tag: [] };
}

function facetValues(recipe: ResolvedRecipe, facet: Facet): string[] {
  switch (facet) {
    case "type":
      return [recipe.type];
    case "method":
      return [recipe.method];
    case "glass":
      return recipe.glass ? [recipe.glass] : [];
    case "tag":
      return recipe.tags;
  }
}

/** Every value each facet takes across the recipes, sorted. */
export function facetOptions(recipes: ResolvedRecipe[]): Filters {
  const options = emptyFilters();
  for (const facet of FACETS) {
    const values = new Set(recipes.flatMap((recipe) => facetValues(recipe, facet)));
    options[facet] = [...values].sort();
  }
  return options;
}

export function matchesFilters(recipe: ResolvedRecipe, filters: Filters): boolean {
  return FACETS.every((facet) => {
    const selected = filters[facet];
    return selected.length === 0 || facetValues(recipe, facet).some((value) => selected.includes(value));
  });
}

/** Reads `?q=…&type=…&tag=…&tag=…`. */
export function parseSearchParams(params: URLSearchParams): SearchState {
  const filters = emptyFilters();
  for (const facet of FACETS) {
    filters[facet] = [...new Set(params.getAll(facet).filter(Boolean))];
  }
  return { query: params.get("q") ?? "", filters };
}

export function toSearchParams({ query, filters }: SearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query);
  for (const facet of FACETS) {
    for (const value of filters[facet]) params.append(facet, value);
  }
  return params;
}
