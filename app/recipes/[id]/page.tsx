import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getRecipe, getRecipeBundle } from "@/lib/content/load";
import { recipeJsonLd, serializeJsonLd } from "@/lib/recipe/json-ld";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { RecipeView } from "./recipe-view";

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
  const details = [recipe.type, recipe.method, recipe.glass].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(recipeJsonLd(recipe, url)) }}
      />

      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← All recipes
      </Link>

      {recipe.illustration && (
        // SVG illustrations are served as-is; next/image's default loader
        // doesn't work in a static export.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/illustrations/${recipe.illustration}`}
          alt=""
          className="mt-6 aspect-square w-48"
        />
      )}

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{recipe.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground capitalize">{details.join(" · ")}</p>
      <p className="mt-4">{recipe.description}</p>
      <ul aria-label="Tags" className="mt-4 flex flex-wrap gap-2">
        {recipe.tags.map((tag) => (
          <li key={tag}>
            <Badge variant="secondary">{tag}</Badge>
          </li>
        ))}
      </ul>

      <RecipeView recipe={recipe} />

      <p className="mt-12 text-sm text-muted-foreground">
        Source:{" "}
        {recipe.source.url ? (
          <a href={recipe.source.url} className="underline underline-offset-4">
            {recipe.source.name}
          </a>
        ) : (
          recipe.source.name
        )}
      </p>
    </main>
  );
}
