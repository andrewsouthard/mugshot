import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getRecipe, getRecipeBundle } from "@/lib/content/load";
import { recipeJsonLd, serializeJsonLd } from "@/lib/recipe/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { RecipeView } from "./recipe-view";
import { SiteHeader } from "@/components/site-header";
import { RecipeGlass } from "@/components/ui/glass";

// A static export can only serve the pages generated at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return getRecipeBundle().recipes.map(({ id }) => ({ id }));
}

export async function generateMetadata(
  props: PageProps<"/recipes/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const recipe = getRecipe(id);
  if (!recipe) return {};

  const path = `/recipes/${recipe.id}`;
  return {
    title: recipe.name,
    description: recipe.description,
    alternates: { canonical: path },
    // The image comes from ./opengraph-image.tsx.
    openGraph: {
      type: "article",
      title: recipe.name,
      description: recipe.description,
      url: path,
      siteName: SITE_NAME,
    },
  };
}

export default async function RecipePage(props: PageProps<"/recipes/[id]">) {
  const { id } = await props.params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  const url = new URL(`/recipes/${recipe.id}`, SITE_URL);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(recipeJsonLd(recipe, url)),
          }}
        />
        <Link href="/" className="text-sm text-ink-muted hover:text-ink">
          ← All recipes
        </Link>
        <div className="mt-6 grid items-center gap-8 border-b border-line pb-8 sm:grid-cols-[1fr_auto] sm:pb-10">
          <div>
            <p className="eyebrow">
              {recipe.type === "coffee" ? "From the café" : "From the bar"}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
              {recipe.name}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
              {recipe.description}
            </p>
            <ul aria-label="Tags" className="mt-5 flex flex-wrap gap-2">
              <li>
                <Badge variant="brand" className="capitalize">
                  {recipe.method}
                </Badge>
              </li>
              {recipe.tags.map((tag) => (
                <li key={tag}>
                  <Badge variant="outline">{tag}</Badge>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex min-h-48 items-center justify-center rounded-card border border-line bg-sunken px-12 py-6 sm:min-h-60 sm:px-16">
            <RecipeGlass recipe={recipe} size={144} />
          </div>
        </div>

        <RecipeView recipe={recipe} />

        <p className="mt-10 border-t border-line pt-5 text-xs text-ink-muted">
          Source:{" "}
          {recipe.source.url ? (
            <a
              href={recipe.source.url}
              className="underline underline-offset-4"
            >
              {recipe.source.name}
            </a>
          ) : (
            recipe.source.name
          )}
        </p>
      </main>
    </>
  );
}
