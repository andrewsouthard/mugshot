import Link from "next/link";
import { getRecipeBundle } from "@/lib/content/load";

// Placeholder until search lands (build order step 3).
export default function Home() {
  const { recipes } = getRecipeBundle();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Mugshot</h1>
      <ul className="mt-6 space-y-4">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <h2 className="font-medium">
              <Link href={`/recipes/${recipe.id}`} className="hover:underline">
                {recipe.name}
              </Link>
            </h2>
            <p className="text-sm text-muted-foreground">{recipe.description}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
