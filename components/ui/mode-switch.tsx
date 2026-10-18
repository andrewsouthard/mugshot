"use client";

import { useSyncExternalStore } from "react";
import { Segmented } from "./segmented";

export type Mode = "system" | "cafe" | "bar";

const KEY = "mugshot-mode";

/** Runs in <head> before paint so a saved mode never flashes. */
export const modeScript = `(function(){try{var m=localStorage.getItem("${KEY}");if(m==="cafe"||m==="bar")document.documentElement.dataset.mode=m}catch(e){}})()`;

const listeners = new Set<() => void>();

function read(): Mode {
  const m = document.documentElement.dataset.mode;
  return m === "cafe" || m === "bar" ? m : "system";
}

function write(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") {
    delete root.dataset.mode;
    localStorage.removeItem(KEY);
  } else {
    root.dataset.mode = mode;
    localStorage.setItem(KEY, mode);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ModeSwitch() {
  const mode = useSyncExternalStore(subscribe, read, () => "system" as Mode);
  return (
    <Segmented
      label="Color mode"
      size="sm"
      value={mode}
      onChange={write}
      options={[
        { value: "system", label: "Auto" },
        { value: "cafe", label: "Café" },
        { value: "bar", label: "Bar" },
      ]}
    />
  );
}
