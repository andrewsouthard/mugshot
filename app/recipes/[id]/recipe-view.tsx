"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RecipeWorkbench } from "@/components/ui/recipe-workbench";
import { StepList } from "@/components/ui/step-list";
import { BrewSpecGrid } from "@/components/ui/stat";
import { SpecList } from "@/components/ui/spec-list";
import { RatioBar } from "@/components/ui/ratio-bar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RecipePersonal } from "@/components/recipe-personal";
import type { ResolvedRecipe } from "@/lib/content/schema";
import { usePreference } from "@/lib/preferences";
import {
  partSizeMl,
  VOLUME_DISPLAYS,
  type DisplayOptions,
  type TemperatureUnit,
  type VolumeDisplay,
} from "@/lib/recipe/format";

const TEMPERATURE_UNITS = ["C", "F"] as const;

export function RecipeView({ recipe }: { recipe: ResolvedRecipe }) {
  const [servings, setServings] = useState(recipe.serves);
  const [volume, setVolume] = usePreference<VolumeDisplay>(
    "volume-unit",
    VOLUME_DISPLAYS,
    "oz",
  );
  const [temperature, setTemperature] = usePreference<TemperatureUnit>(
    "temperature-unit",
    TEMPERATURE_UNITS,
    "C",
  );
  const options: DisplayOptions = {
    scale: servings / recipe.serves,
    volume: recipe.type === "cocktail" ? volume : undefined,
    partMl: partSizeMl(recipe.ingredients),
  };

  return (
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
      <div className="min-w-0 space-y-6">
        <section
          aria-labelledby="ingredients"
          className="rounded-card border border-line bg-surface p-5 sm:p-6"
        >
          <h2 id="ingredients" className="eyebrow mb-5">
            Ingredients
          </h2>
          <RecipeWorkbench
            ingredients={recipe.ingredients}
            serves={recipe.serves}
            servings={servings}
            onServingsChange={setServings}
            volume={volume}
            onVolumeChange={setVolume}
            noun={["serving", "servings"]}
          />
          {recipe.type === "cocktail" && (
            <RatioBar
              ingredients={recipe.ingredients}
              className="mt-6 border-t border-line pt-5"
            />
          )}
        </section>
        {recipe.brew && (
          <section aria-labelledby="brew">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="brew" className="eyebrow">
                Brew settings
              </h2>
              <UnitToggle
                label="Temperature unit"
                units={TEMPERATURE_UNITS}
                value={temperature}
                onChange={setTemperature}
                format={(unit) => `°${unit}`}
              />
            </div>
            <BrewSpecGrid
              recipe={recipe}
              temperature={temperature}
              scale={options.scale}
            />
          </section>
        )}
        <section
          aria-labelledby="equipment"
          className="rounded-card border border-line p-5 sm:p-6"
        >
          <h2 id="equipment" className="eyebrow mb-4">
            Before you start
          </h2>
          <SpecList
            items={[
              ["Equipment", recipe.equipment.join(", ")],
              ...(recipe.glass
                ? [["Glass", recipe.glass] as [string, string]]
                : []),
              ["Method", recipe.method],
            ]}
          />
        </section>
      </div>
      <div className="min-w-0 space-y-8">
        <section aria-labelledby="steps">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="steps" className="eyebrow">
              The method
            </h2>
            <span className="measure text-xs text-ink-muted">
              {recipe.steps.length} steps
            </span>
          </div>
          <StepList
            steps={recipe.steps}
            ingredients={recipe.ingredients}
            options={options}
          />
          <Button
            size="lg"
            className="mt-8 h-12 w-full"
            nativeButton={false}
            render={
              <Link href={`/recipes/${recipe.id}/make?servings=${servings}`} />
            }
          >
            Make it <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            One step at a time, with timers along the way.
          </p>
        </section>
        <RecipePersonal recipeId={recipe.id} />
      </div>
    </div>
  );
}

function UnitToggle<T extends string>({
  label,
  units,
  value,
  onChange,
  format,
}: {
  label: string;
  units: readonly T[];
  value: T;
  onChange: (unit: T) => void;
  format: (unit: T) => string;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={(next) => {
        // Pressing the active unit again would leave none selected.
        const unit = units.find((candidate) => next.includes(candidate));
        if (unit) onChange(unit);
      }}
    >
      {units.map((unit) => (
        <ToggleGroupItem key={unit} value={unit}>
          {format(unit)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
