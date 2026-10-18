"use client";

import { useState } from "react";
import type { Ingredient } from "@/lib/drinks";
import type { UnitSystem } from "@/lib/units";
import { IngredientList } from "./ingredient-list";
import { Segmented } from "./segmented";
import { Stepper } from "./stepper";

/** Ingredient spec with live unit conversion and batch scaling. */
export function RecipeWorkbench({
  ingredients,
  serves = 1,
  defaultSystem = "oz",
  noun = ["drink", "drinks"],
}: {
  ingredients: Ingredient[];
  serves?: number;
  defaultSystem?: UnitSystem;
  noun?: [string, string];
}) {
  const [system, setSystem] = useState<UnitSystem>(defaultSystem);
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
          <Segmented
            label="Units"
            value={system}
            onChange={setSystem}
            options={[
              { value: "oz", label: "oz" },
              { value: "ml", label: "ml" },
            ]}
          />
        )}
      </div>
      <IngredientList
        className="mt-4"
        ingredients={ingredients}
        system={system}
        scale={count / serves}
      />
    </div>
  );
}
