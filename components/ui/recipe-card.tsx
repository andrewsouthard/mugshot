import Link from "next/link";
import type { Recipe } from "@/lib/drinks";
import { glassLabel, methodLabel } from "@/lib/drinks";
import { RecipeGlass } from "./glass";
import { Tag } from "./tag";
import { cn } from "@/lib/cn";

/** Pass href to make the whole card a link. */
export function RecipeCard({
  recipe,
  href,
  className,
}: {
  recipe: Recipe;
  href?: string;
  className?: string;
}) {
  const Root = href ? Link : "div";
  return (
    <Root
      href={href ?? ""}
      className={cn(
        "group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition hover:border-line-strong hover:shadow-lift",
        className,
      )}
    >
      <div className="relative flex h-36 items-end justify-center bg-sunken pb-3">
        <Tag tone="brand" className="absolute top-3 left-3">
          {methodLabel[recipe.method]}
        </Tag>
        <RecipeGlass
          recipe={recipe}
          size={80}
          className="transition-transform duration-200 group-hover:-rotate-3"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-bold tracking-tight">{recipe.name}</h3>
          <span className="measure text-xs text-ink-faint">
            {recipe.minutes} min
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-ink-muted">
          {recipe.tagline}
        </p>
        <div className="mt-auto pt-3">
          <Tag tone="outline">{glassLabel[recipe.glass]}</Tag>
        </div>
      </div>
    </Root>
  );
}
