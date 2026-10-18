import Link from "next/link";
import { cn } from "cn";
import type { ResolvedRecipe } from "@/lib/content/schema";
import { Badge } from "./badge";
import { glassLabel, RecipeGlass, type GlassName } from "./glass";

/** Pass href to make the whole card a link. */
export function RecipeCard({
  recipe,
  href,
  className,
}: {
  recipe: ResolvedRecipe;
  href?: string;
  className?: string;
}) {
  const Root = href ? Link : "div";
  const glass = recipe.glass && (glassLabel[recipe.glass as GlassName] ?? recipe.glass);
  return (
    <Root
      href={href ?? ""}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition hover:border-line-strong hover:shadow-lift",
        className,
      )}
    >
      <div className="relative flex h-36 items-end justify-center bg-sunken pb-3">
        <Badge variant="brand" className="absolute top-3 left-3 capitalize">
          {recipe.method}
        </Badge>
        <RecipeGlass
          recipe={recipe}
          size={80}
          className="transition-transform duration-200 group-hover:-rotate-3"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold tracking-tight">{recipe.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">
          {recipe.description}
        </p>
        {glass && (
          <div className="mt-auto pt-3">
            <Badge variant="outline" className="capitalize">
              {glass}
            </Badge>
          </div>
        )}
      </div>
    </Root>
  );
}
