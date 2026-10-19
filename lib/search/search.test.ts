import { describe, expect, it } from "vitest";
import { loadRecipeBundle } from "../content/load";
import {
  emptyFilters,
  facetOptions,
  matchesFilters,
  parseSearchParams,
  toSearchParams,
} from "./filters";
import { allowedTypos, editDistance, fuzzyMatches } from "./fuzzy";
import { createRecipeSearch, words } from "./index";

const { recipes } = loadRecipeBundle();
const search = createRecipeSearch(recipes);

describe("createRecipeSearch", () => {
  it("returns everything for an empty query", () => {
    expect(search("  ")).toEqual(recipes.map((recipe) => recipe.id));
  });

  it("matches name prefixes as you type", () => {
    expect(search("s")).toContain("sidecar");
    expect(search("side")).toEqual(["sidecar"]);
    expect(search("FRENCH pr")).toEqual(["french-press"]);
  });

  it("matches ingredient names, tags and description", () => {
    expect(search("cognac")).toEqual(["sidecar"]);
    expect(search("immersion")).toEqual(["french-press"]);
    expect(search("sediment")).toEqual(["french-press"]);
  });

  it("requires every word to match somewhere", () => {
    expect(search("lemon classic")).toEqual(["sidecar"]);
    expect(search("lemon immersion")).toEqual([]);
  });

  it("ranks name matches above description matches", () => {
    const ranked = createRecipeSearch([
      { ...recipes[0], id: "a", name: "Plain", description: "Mentions orange." },
      { ...recipes[0], id: "b", name: "Orange", description: "Plain." },
    ]);
    expect(ranked("orange")).toEqual(["b", "a"]);
  });

  it("falls back to typo-tolerant matching on names", () => {
    expect(search("sidcar")).toEqual(["sidecar"]);
    expect(search("cogniac")).toEqual(["sidecar"]);
    expect(search("cointraeu")).toEqual(["sidecar"]);
    expect(search("xyzzy")).toEqual([]);
  });
});

describe("fuzzy matching", () => {
  it("measures edit distance", () => {
    expect(editDistance("kitten", "sitting")).toBe(3);
    expect(editDistance("same", "same")).toBe(0);
  });

  it("allows 0 typos under 4 letters, 1 for 4–7, 2 for 8+", () => {
    expect(allowedTypos("gin")).toBe(0);
    expect(allowedTypos("rumm")).toBe(1);
    expect(allowedTypos("cointrea")).toBe(2);
    expect(fuzzyMatches("gim", ["gin"])).toBe(false);
    expect(fuzzyMatches("lemn", ["lemon"])).toBe(true);
    expect(fuzzyMatches("lmn", ["lemon"])).toBe(false);
  });

  it("splits words and strips accents", () => {
    expect(words("Crème de-Cacao")).toEqual(["creme", "de", "cacao"]);
  });
});

describe("filters", () => {
  const [frenchPress, sidecar] = recipes;

  it("lists facet values", () => {
    const options = facetOptions(recipes);
    expect(options.type).toEqual(["cocktail", "coffee"]);
    expect(options.glass).toEqual(["coupe"]);
    expect(options.tag).toContain("sour");
  });

  it("ORs within a facet and ANDs across facets", () => {
    const filters = { ...emptyFilters(), type: ["cocktail", "coffee"] };
    expect(matchesFilters(frenchPress, filters)).toBe(true);
    expect(matchesFilters(sidecar, filters)).toBe(true);
    filters.glass = ["coupe"];
    expect(matchesFilters(frenchPress, filters)).toBe(false);
    expect(matchesFilters(sidecar, filters)).toBe(true);
  });

  it("round-trips through the URL", () => {
    const state = { query: "sour", filters: { ...emptyFilters(), tag: ["classic", "shaken"] } };
    const params = toSearchParams(state);
    expect(params.toString()).toBe("q=sour&tag=classic&tag=shaken");
    expect(parseSearchParams(params)).toEqual(state);
  });
});
