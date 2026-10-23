import { Suspense } from "react";
import { getRecipeBundle } from "@/lib/content/load";
import { RecipeSearch, SearchView } from "./recipe-search";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  const { recipes } = getRecipeBundle();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="eyebrow">The home drinks collection</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          A good drink, made by you.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">
          Cocktails and coffee to make at home. Find your recipe, measure it
          out, and we’ll take it step by step.
        </p>
        {/* The query lives in the URL, which a static page only sees in the
          browser. Until then, show every recipe. */}
        <Suspense fallback={<SearchView recipes={recipes} />}>
          <RecipeSearch recipes={recipes} />
        </Suspense>
      </main>
    </>
  );
}
