"use client";

import { useState } from "react";
import { Stepper } from "@/components/ui/stepper";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const SHELVES = [
  ["all", "All"],
  ["bar", "Bar"],
  ["cafe", "Café"],
] as const;

export function ToggleGroupDemo() {
  const [shelf, setShelf] = useState<string>("all");
  return (
    <ToggleGroup
      aria-label="Shelf"
      variant="outline"
      size="sm"
      spacing={0}
      value={[shelf]}
      onValueChange={(next) => {
        // Pressing the active item again would leave none selected.
        if (next[0]) setShelf(next[0]);
      }}
    >
      {SHELVES.map(([value, label]) => (
        <ToggleGroupItem key={value} value={value}>
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function StepperDemo() {
  const [n, setN] = useState(2);
  return (
    <Stepper
      label="Servings"
      value={n}
      onChange={setN}
      suffix={(v) => (v === 1 ? "drink" : "drinks")}
    />
  );
}
