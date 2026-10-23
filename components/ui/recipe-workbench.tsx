"use client";

import { useState } from "react";
import type { ResolvedIngredientLine } from "@/lib/content/schema";
import {
  partSizeMl,
  VOLUME_DISPLAYS,
  type VolumeDisplay,
} from "@/lib/recipe/format";
import { IngredientList } from "./ingredient-list";
import { Stepper } from "./stepper";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

/** Ingredient spec with live unit conversion and batch scaling. */
export function RecipeWorkbench({
  ingredients,
  serves = 1,
  defaultVolume = "oz",
  noun = ["drink", "drinks"],
  servings,
  onServingsChange,
  volume: controlledVolume,
  onVolumeChange,
}: {
  ingredients: ResolvedIngredientLine[];
  serves?: number;
  defaultVolume?: VolumeDisplay;
  noun?: [string, string];
  servings?: number;
  onServingsChange?: (value: number) => void;
  volume?: VolumeDisplay;
  onVolumeChange?: (value: VolumeDisplay) => void;
}) {
  const [localVolume, setLocalVolume] = useState<VolumeDisplay>(defaultVolume);
  const [localCount, setLocalCount] = useState(serves);
  const volume = controlledVolume ?? localVolume;
  const count = servings ?? localCount;
  const setVolume = onVolumeChange ?? setLocalVolume;
  const setCount = onServingsChange ?? setLocalCount;
  const convertible = ingredients.some(
    (i) => i.unit === "oz" || i.unit === "ml",
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stepper
          label="Servings"
          value={count}
          onChange={setCount}
          suffix={(n) => (n === 1 ? noun[0] : noun[1])}
        />
        {convertible && (
          <ToggleGroup
            aria-label="Volume unit"
            variant="outline"
            size="sm"
            spacing={0}
            value={[volume]}
            onValueChange={(next) => {
              // Pressing the active unit again would leave none selected.
              const unit = VOLUME_DISPLAYS.find((candidate) =>
                next.includes(candidate),
              );
              if (unit) setVolume(unit);
            }}
          >
            {VOLUME_DISPLAYS.map((unit) => (
              <ToggleGroupItem key={unit} value={unit}>
                {unit}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      {convertible && volume === "parts" && (
        <p className="mt-4 text-sm text-ink-muted">
          Use a full jigger as 1 part, and the same measure throughout. Amounts
          scale with servings; your jigger size sets the drink size.
        </p>
      )}
      <IngredientList
        className="mt-4"
        ingredients={ingredients}
        options={{
          scale: count / serves,
          volume: convertible ? volume : undefined,
          partMl: partSizeMl(ingredients),
        }}
      />
    </div>
  );
}
