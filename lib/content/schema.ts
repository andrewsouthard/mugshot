import { z } from "zod";

const kebabId = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "must be kebab-case");

export const ingredientSchema = z.strictObject({
  id: kebabId,
  name: z.string().min(1),
  category: z.string().min(1),
});

export const ingredientCatalogSchema = z.array(ingredientSchema);

export const unitSchema = z.enum([
  "oz",
  "ml",
  "g",
  "dash",
  "barspoon",
  "piece",
  "to-taste",
]);

export const ingredientLineSchema = z
  .strictObject({
    ingredient: kebabId,
    amount: z.number().positive().optional(),
    unit: unitSchema,
    note: z.string().min(1).optional(),
    optional: z.boolean().optional(),
  })
  .refine((line) => (line.unit === "to-taste") === (line.amount === undefined), {
    message: "amount is required, except for to-taste where it must be left out",
    path: ["amount"],
  });

export const timerSchema = z.strictObject({
  kind: z.enum(["countdown", "stopwatch"]),
  seconds: z.int().positive(),
  autoStart: z.boolean(),
});

export const targetSchema = z.strictObject({
  ingredient: kebabId,
  amount: z.number().positive(),
  unit: z.enum(["oz", "ml", "g"]),
});

export const stepSchema = z.strictObject({
  text: z.string().min(1),
  timer: timerSchema.optional(),
  target: targetSchema.optional(),
});

export const recipeSchema = z.strictObject({
  id: kebabId,
  name: z.string().min(1),
  type: z.enum(["cocktail", "coffee"]),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)),
  serves: z.int().positive(),
  method: z.string().min(1),
  glass: z.string().min(1).optional(),
  equipment: z.array(z.string().min(1)),
  brew: z
    .strictObject({
      waterTempC: z.number().positive(),
      grind: z.string().min(1),
    })
    .optional(),
  ingredients: z.array(ingredientLineSchema).min(1),
  steps: z.array(stepSchema).min(1),
  illustration: z.string().min(1).nullable(),
  source: z.strictObject({
    name: z.string().min(1),
    url: z.url().optional(),
  }),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Unit = z.infer<typeof unitSchema>;
export type IngredientLine = z.infer<typeof ingredientLineSchema>;
export type Timer = z.infer<typeof timerSchema>;
export type Target = z.infer<typeof targetSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Recipe = z.infer<typeof recipeSchema>;

/** An ingredient line with its catalog entry filled in. */
export type ResolvedIngredientLine = IngredientLine &
  Pick<Ingredient, "name" | "category">;

export type ResolvedRecipe = Omit<Recipe, "ingredients"> & {
  ingredients: ResolvedIngredientLine[];
};

/** The shape of `recipes.json`. */
export type RecipeBundle = {
  /** Content hash, used to detect new content. */
  hash: string;
  recipes: ResolvedRecipe[];
};
