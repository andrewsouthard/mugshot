"use client";

import { MinusIcon, PlusIcon, TargetIcon, TimerIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ResolvedRecipe } from "@/lib/content/schema";
import { usePreference } from "@/lib/preferences";
import {
  brewRatio,
  describeTimer,
  formatIngredient,
  formatTarget,
  formatTemperature,
  renderStepText,
  type DisplayOptions,
  type TemperatureUnit,
  type VolumeUnit,
} from "@/lib/recipe/format";

const MAX_SERVINGS = 12;
const VOLUME_UNITS = ["oz", "ml"] as const;
const TEMPERATURE_UNITS = ["C", "F"] as const;

/** The interactive part of a recipe page: servings, units and the method. */
export function RecipeView({ recipe }: { recipe: ResolvedRecipe }) {
  const [servings, setServings] = useState(recipe.serves);
  const [volume, setVolume] = usePreference<VolumeUnit>("volume-unit", VOLUME_UNITS, "oz");
  const [temperature, setTemperature] = usePreference<TemperatureUnit>(
    "temperature-unit",
    TEMPERATURE_UNITS,
    "C",
  );

  const options: DisplayOptions = {
    scale: servings / recipe.serves,
    // Coffee is always weighed in grams.
    volume: recipe.type === "cocktail" ? volume : undefined,
  };
  const ratio = brewRatio(recipe);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="group" aria-label="Servings" className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Fewer servings"
            disabled={servings <= 1}
            onClick={() => setServings(servings - 1)}
          >
            <MinusIcon />
          </Button>
          <output aria-live="polite" className="min-w-24 text-center text-sm tabular-nums">
            {servings} {servings === 1 ? "serving" : "servings"}
          </output>
          <Button
            variant="outline"
            size="icon"
            aria-label="More servings"
            disabled={servings >= MAX_SERVINGS}
            onClick={() => setServings(servings + 1)}
          >
            <PlusIcon />
          </Button>
        </div>
        {recipe.type === "cocktail" && (
          <UnitToggle
            label="Volume unit"
            units={VOLUME_UNITS}
            value={volume}
            onChange={setVolume}
            format={(unit) => unit}
          />
        )}
      </div>

      <section aria-labelledby="ingredients" className="mt-8">
        <h2 id="ingredients" className="text-lg font-semibold">
          Ingredients
        </h2>
        <ul className="mt-3 space-y-2">
          {recipe.ingredients.map((line) => (
            <li key={line.ingredient} className="flex flex-wrap items-baseline gap-x-2">
              <span>{formatIngredient(line, options)}</span>
              {line.note && <span className="text-sm text-muted-foreground">{line.note}</span>}
              {line.optional && <Badge variant="outline">optional</Badge>}
            </li>
          ))}
        </ul>
      </section>

      {recipe.brew && (
        <section aria-labelledby="brew" className="mt-8">
          <h2 id="brew" className="text-lg font-semibold">
            Brew
          </h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2">
            <dt className="text-muted-foreground">Grind</dt>
            <dd>{recipe.brew.grind}</dd>
            <dt className="text-muted-foreground">Water</dt>
            <dd className="flex items-center gap-3">
              <span className="tabular-nums">
                {formatTemperature(recipe.brew.waterTempC, temperature)}
              </span>
              <UnitToggle
                label="Temperature unit"
                units={TEMPERATURE_UNITS}
                value={temperature}
                onChange={setTemperature}
                format={(unit) => `°${unit}`}
              />
            </dd>
            {ratio && (
              <>
                <dt className="text-muted-foreground">Ratio</dt>
                <dd className="tabular-nums">{ratio}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      <section aria-labelledby="equipment" className="mt-8">
        <h2 id="equipment" className="text-lg font-semibold">
          Equipment
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          {recipe.equipment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <Separator className="my-8" />

      <section aria-labelledby="steps">
        <h2 id="steps" className="text-lg font-semibold">
          Steps
        </h2>
        <ol className="mt-3 list-decimal space-y-4 pl-5">
          {recipe.steps.map((step, index) => (
            <li key={index} className="pl-1">
              <p>{renderStepText(step.text, recipe.ingredients, options)}</p>
              {(step.timer || step.target) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {step.timer && (
                    <Badge variant="secondary">
                      <TimerIcon data-icon="inline-start" />
                      {describeTimer(step.timer)}
                    </Badge>
                  )}
                  {step.target && (
                    <Badge variant="secondary">
                      <TargetIcon data-icon="inline-start" />
                      Target: {formatTarget(step.target, recipe.ingredients, options)}
                    </Badge>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Guided mode lands in build order step 4. */}
      <Button size="lg" className="mt-8" disabled>
        Make it
      </Button>
    </>
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
