"use client";

import { useState } from "react";
import type { ResolvedIngredientLine } from "@/lib/content/schema";
import type { VolumeUnit } from "@/lib/recipe/format";
import { IngredientList } from "./ingredient-list";
import { Stepper } from "./stepper";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

const VOLUME_UNITS = ["oz", "ml"] as const;

/** Ingredient spec with live unit conversion and batch scaling. */
export function RecipeWorkbench({
  ingredients,
  serves = 1,
  defaultVolume = "oz",
  noun = ["drink", "drinks"],
}: {
  ingredients: ResolvedIngredientLine[];
  serves?: number;
  defaultVolume?: VolumeUnit;
  noun?: [string, string];
}) {
  const [volume, setVolume] = useState<VolumeUnit>(defaultVolume);
  const [count, setCount] = useState(serves);
  const convertible = ingredients.some((i) => i.unit === "oz" || i.unit === "ml");

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
              const unit = VOLUME_UNITS.find((candidate) => next.includes(candidate));
              if (unit) setVolume(unit);
            }}
          >
            {VOLUME_UNITS.map((unit) => (
              <ToggleGroupItem key={unit} value={unit}>
                {unit}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </div>
      <IngredientList
        className="mt-4"
        ingredients={ingredients}
        options={{ scale: count / serves, volume: convertible ? volume : undefined }}
      />
    </div>
  );
}
