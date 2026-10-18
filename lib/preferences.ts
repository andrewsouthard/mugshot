"use client";

import { useCallback, useSyncExternalStore } from "react";

// Small preferences live in localStorage. The server snapshot is the default,
// so prerendered HTML always matches the first client render.

const listeners = new Set<() => void>();
// Used when storage is unavailable, so toggles still work for the visit.
const memory = new Map<string, string>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

/** A preference that's one of `options`, persisted under `mugshot:<key>`. */
export function usePreference<T extends string>(
  key: string,
  options: readonly T[],
  fallback: T,
): [T, (value: T) => void] {
  const storageKey = `mugshot:${key}`;
  const stored = useSyncExternalStore(
    subscribe,
    () => read(storageKey),
    () => null,
  );
  const value = options.includes(stored as T) ? (stored as T) : fallback;

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        memory.set(storageKey, next);
      }
      listeners.forEach((listener) => listener());
    },
    [storageKey],
  );

  return [value, setValue];
}
