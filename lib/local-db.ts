"use client";

// A small key-value wrapper over IndexedDB for data that stays on the device.
// Falls back to memory when IndexedDB is unavailable (some private modes), so
// features still work for the visit.

const DB_NAME = "mugshot";
const DB_VERSION = 1;
export const STORES = ["sessions", "favorites", "notes"] as const;
export type Store = (typeof STORES)[number];

let opening: Promise<IDBDatabase | null> | undefined;
const memory = new Map<string, unknown>();

function open(): Promise<IDBDatabase | null> {
  opening ??= new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        for (const store of STORES) {
          if (!request.result.objectStoreNames.contains(store)) {
            request.result.createObjectStore(store);
          }
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return opening;
}

async function run<T>(
  store: Store,
  mode: IDBTransactionMode,
  action: (objectStore: IDBObjectStore) => IDBRequest,
  fallback: () => T,
): Promise<T> {
  const db = await open();
  if (!db) return fallback();
  return new Promise((resolve, reject) => {
    const request = action(db.transaction(store, mode).objectStore(store));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

export function getItem<T>(store: Store, key: string): Promise<T | undefined> {
  return run(store, "readonly", (s) => s.get(key), () => memory.get(`${store}/${key}`) as T);
}

export function setItem(store: Store, key: string, value: unknown): Promise<void> {
  return run(
    store,
    "readwrite",
    (s) => s.put(value, key),
    () => void memory.set(`${store}/${key}`, value),
  ).then(() => undefined);
}

export function deleteItem(store: Store, key: string): Promise<void> {
  return run(
    store,
    "readwrite",
    (s) => s.delete(key),
    () => void memory.delete(`${store}/${key}`),
  ).then(() => undefined);
}
