import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getRecipe, getRecipeBundle } from "@/lib/content/load";
import { GuidedMode } from "./guided-mode";

// A static export can only serve the pages generated at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return getRecipeBundle().recipes.map(({ id }) => ({ id }));
}

export async function generateMetadata(
  props: PageProps<"/recipes/[id]/make">,
): Promise<Metadata> {
  const { id } = await props.params;
  const recipe = getRecipe(id);
  if (!recipe) return {};
  return {
    title: `Make ${recipe.name}`,
    // The recipe page is the one to index.
    robots: { index: false },
  };
}

export default async function MakePage(props: PageProps<"/recipes/[id]/make">) {
  const { id } = await props.params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  // Servings come from the URL, which a static page only sees in the browser.
  return (
    <Suspense fallback={<div className="fixed inset-0 z-40 bg-background" />}>
      <GuidedMode recipe={recipe} />
    </Suspense>
  );
}
