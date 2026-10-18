"use client";

import { useCallback, useEffect, useState } from "react";
import { getItem, setItem, deleteItem } from "./local-db";

/** Whether a recipe is a favorite, stored on the device. */
export function useFavorite(recipeId: string): [boolean, (favorite: boolean) => void] {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    let current = true;
    void getItem<boolean>("favorites", recipeId).then((stored) => {
      if (current) setFavorite(stored === true);
    });
    return () => {
      current = false;
    };
  }, [recipeId]);

  const update = useCallback(
    (next: boolean) => {
      setFavorite(next);
      void (next ? setItem("favorites", recipeId, true) : deleteItem("favorites", recipeId));
    },
    [recipeId],
  );

  return [favorite, update];
}

/** A personal note on a recipe, stored on the device. */
export function useNote(recipeId: string): [string, (note: string) => void] {
  const [note, setNote] = useState("");

  useEffect(() => {
    let current = true;
    void getItem<string>("notes", recipeId).then((stored) => {
      if (current) setNote(stored ?? "");
    });
    return () => {
      current = false;
    };
  }, [recipeId]);

  const update = useCallback(
    (next: string) => {
      setNote(next);
      void (next.trim() ? setItem("notes", recipeId, next) : deleteItem("notes", recipeId));
    },
    [recipeId],
  );

  return [note, update];
}
