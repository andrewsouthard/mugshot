"use client";

import { SearchIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import type { ResolvedRecipe } from "@/lib/content/schema";
import {
  emptyFilters,
  FACET_LABELS,
  FACETS,
  facetOptions,
  matchesFilters,
  parseSearchParams,
  toSearchParams,
  type Facet,
  type SearchState,
} from "@/lib/search/filters";
import { createRecipeSearch } from "@/lib/search/index";

/** Search and filters, kept in the URL so a search can be shared. */
export function RecipeSearch({ recipes }: { recipes: ResolvedRecipe[] }) {
  const searchParams = useSearchParams();
  // The URL is read once; after that local state leads and the URL follows,
  // so typing never waits on the router.
  const [state, setState] = useState(() => parseSearchParams(searchParams));

  const onChange = (next: SearchState) => {
    setState(next);
    const query = toSearchParams(next).toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  return <SearchView recipes={recipes} state={state} onChange={onChange} />;
}

const NO_SEARCH: SearchState = { query: "", filters: emptyFilters() };

export function SearchView({
  recipes,
  state = NO_SEARCH,
  onChange,
}: {
  recipes: ResolvedRecipe[];
  state?: SearchState;
  onChange?: (state: SearchState) => void;
}) {
  const search = useMemo(() => createRecipeSearch(recipes), [recipes]);
  const options = useMemo(() => facetOptions(recipes), [recipes]);
  const byId = useMemo(() => new Map(recipes.map((recipe) => [recipe.id, recipe])), [recipes]);

  const results = search(state.query)
    .map((id) => byId.get(id)!)
    .filter((recipe) => matchesFilters(recipe, state.filters));
  const filtered =
    state.query.trim() !== "" || FACETS.some((facet) => state.filters[facet].length > 0);

  const toggle = (facet: Facet, value: string, pressed: boolean) => {
    const selected = state.filters[facet].filter((candidate) => candidate !== value);
    if (pressed) selected.push(value);
    onChange?.({ ...state, filters: { ...state.filters, [facet]: selected } });
  };

  return (
    <>
      <search className="mt-8 space-y-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search recipes"
            placeholder="Search by name, ingredient or tag"
            className="h-10 pl-9"
            value={state.query}
            disabled={!onChange}
            onChange={(event) => onChange?.({ ...state, query: event.target.value })}
          />
        </div>

        <div className="space-y-2">
          {FACETS.filter((facet) => options[facet].length > 0).map((facet) => (
            <div
              key={facet}
              role="group"
              aria-label={FACET_LABELS[facet]}
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="w-16 shrink-0 text-xs text-muted-foreground">
                {FACET_LABELS[facet]}
              </span>
              {options[facet].map((value) => (
                <Toggle
                  key={value}
                  variant="outline"
                  size="sm"
                  className="capitalize"
                  disabled={!onChange}
                  pressed={state.filters[facet].includes(value)}
                  onPressedChange={(pressed) => toggle(facet, value, pressed)}
                >
                  {value}
                </Toggle>
              ))}
            </div>
          ))}
        </div>
      </search>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "recipe" : "recipes"}
        </p>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => onChange?.(NO_SEARCH)}>
            <XIcon data-icon="inline-start" />
            Clear
          </Button>
        )}
      </div>

      {results.length > 0 ? (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 text-center text-muted-foreground">
          No recipes match. Try fewer words or filters.
        </p>
      )}
    </>
  );
}

function RecipeCard({ recipe }: { recipe: ResolvedRecipe }) {
  const details = [recipe.type, recipe.method, recipe.glass].filter(Boolean);
  return (
    <Card className="relative h-full transition-colors hover:bg-muted/50">
      {recipe.illustration && (
        // SVGs are served as-is; next/image's default loader doesn't work in
        // a static export.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/illustrations/${recipe.illustration}`}
          alt=""
          className="mx-auto aspect-square w-32"
        />
      )}
      <CardHeader>
        <CardTitle>
          <Link href={`/recipes/${recipe.id}`} className="after:absolute after:inset-0">
            {recipe.name}
          </Link>
        </CardTitle>
        <p className="text-xs text-muted-foreground capitalize">{details.join(" · ")}</p>
        <CardDescription>{recipe.description}</CardDescription>
        <ul aria-label="Tags" className="mt-2 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </li>
          ))}
        </ul>
      </CardHeader>
    </Card>
  );
}
