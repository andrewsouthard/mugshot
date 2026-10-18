"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { Stepper } from "@/components/ui/stepper";

export function SegmentedDemo() {
  const [unit, setUnit] = useState("oz");
  const [family, setFamily] = useState("all");
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented
        label="Units"
        value={unit}
        onChange={setUnit}
        options={[
          { value: "oz", label: "oz" },
          { value: "ml", label: "ml" },
        ]}
      />
      <Segmented
        label="Shelf"
        value={family}
        onChange={setFamily}
        options={[
          { value: "all", label: "All" },
          { value: "bar", label: "Bar" },
          { value: "cafe", label: "Café" },
        ]}
      />
    </div>
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
