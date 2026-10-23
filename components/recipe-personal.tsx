"use client";

import { HeartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFavorite, useNote } from "@/lib/local-data";
import { cn } from "cn";

export function RecipePersonal({ recipeId }: { recipeId: string }) {
  const [favorite, setFavorite] = useFavorite(recipeId);
  const [note, setNote] = useNote(recipeId);

  return (
    <section
      aria-label="Your recipe"
      className="rounded-card border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="eyebrow">Your recipe</h2>
        <Button
          variant="outline"
          aria-pressed={favorite}
          onClick={() => setFavorite(!favorite)}
        >
          <HeartIcon
            data-icon="inline-start"
            className={cn(favorite && "fill-brand text-brand-strong")}
          />
          {favorite ? "Favorited" : "Favorite"}
        </Button>
      </div>
      <label className="mt-5 block">
        <span className="text-sm font-medium">Your notes</span>
        <Textarea
          className="mt-2 min-h-28"
          placeholder="What would you change next time?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </label>
      <p className="mt-2 text-xs text-ink-muted">Saved on this device.</p>
    </section>
  );
}
