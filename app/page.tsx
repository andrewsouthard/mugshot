import { Suspense } from "react";
import { getRecipeBundle } from "@/lib/content/load";
import { RecipeSearch, SearchView } from "./recipe-search";

export default function Home() {
  const { recipes } = getRecipeBundle();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Mugshot</h1>
      <p className="mt-1 text-muted-foreground">Cocktails and coffee to make at home.</p>
      {/* The query lives in the URL, which a static page only sees in the
          browser. Until then, show every recipe. */}
      <Suspense fallback={<SearchView recipes={recipes} />}>
        <RecipeSearch recipes={recipes} />
      </Suspense>
    </main>
  );
}
