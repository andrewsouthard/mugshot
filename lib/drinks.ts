/**
 * The recipe model. Amounts are stored the way a recipe is written (¾ oz,
 * 18 g, 2 dashes) and converted only at display time — see lib/units.ts.
 */

export type Unit =
  | "oz"
  | "ml"
  | "g"
  | "barspoon"
  | "dash"
  | "drop"
  | "top"
  | "piece";

export type IngredientKind =
  | "spirit"
  | "clear"
  | "liqueur"
  | "fortified"
  | "citrus"
  | "syrup"
  | "bitters"
  | "coffee"
  | "milk"
  | "foam"
  | "water"
  | "soda"
  | "garnish";

export type Method =
  | "shaken"
  | "stirred"
  | "built"
  | "thrown"
  | "espresso"
  | "pour-over"
  | "immersion"
  | "steamed";

export type Glass =
  | "coupe"
  | "nick-and-nora"
  | "martini"
  | "rocks"
  | "highball"
  | "mug"
  | "cup"
  | "latte";

export type Ingredient = {
  amount?: number;
  unit: Unit;
  name: string;
  kind: IngredientKind;
  note?: string;
};

export type Step = {
  text: string;
  /** Seconds — renders a timer chip on the step. */
  duration?: number;
};

/** Barista dial-in parameters. */
export type BrewSpec = {
  dose: number; // g in
  yield: number; // g out
  time?: [number, number]; // target seconds range
  temp?: number; // °C
  grind?: string;
};

/** 0–5 for each axis. */
export type Profile = {
  sweet: number;
  sour: number;
  bitter: number;
  strong: number;
  body: number;
};

export type Recipe = {
  slug: string;
  name: string;
  tagline: string;
  family: "cocktail" | "coffee";
  method: Method;
  glass: Glass;
  ice?: "cubed" | "large cube" | "crushed" | "none";
  garnish?: string;
  serves: number;
  minutes: number;
  ingredients: Ingredient[];
  steps: Step[];
  brew?: BrewSpec;
  profile: Profile;
  /** How full the glass looks, 0–1. Defaults to 0.85. */
  fill?: number;
  /**
   * What ends up in the glass, when it isn't the ingredients themselves —
   * beans and water go in, coffee comes out.
   */
  served?: Array<{ kind: IngredientKind; ml: number }>;
};

export const kindLabel: Record<IngredientKind, string> = {
  spirit: "Aged spirit",
  clear: "Clear spirit",
  liqueur: "Liqueur",
  fortified: "Fortified wine",
  citrus: "Citrus",
  syrup: "Syrup",
  bitters: "Bitters",
  coffee: "Coffee",
  milk: "Milk",
  foam: "Foam",
  water: "Water",
  soda: "Soda",
  garnish: "Garnish",
};

export const methodLabel: Record<Method, string> = {
  shaken: "Shaken",
  stirred: "Stirred",
  built: "Built",
  thrown: "Thrown",
  espresso: "Espresso",
  "pour-over": "Pour-over",
  immersion: "Immersion",
  steamed: "Steamed",
};

export const glassLabel: Record<Glass, string> = {
  coupe: "Coupe",
  "nick-and-nora": "Nick & Nora",
  martini: "Martini",
  rocks: "Rocks",
  highball: "Highball",
  mug: "Mug",
  cup: "Cup & saucer",
  latte: "Latte glass",
};

export const recipes: Recipe[] = [
  {
    slug: "daiquiri",
    name: "Daiquiri",
    tagline: "Rum, lime, sugar. The bartender's handshake.",
    family: "cocktail",
    method: "shaken",
    glass: "coupe",
    ice: "none",
    garnish: "Lime wheel",
    serves: 1,
    minutes: 3,
    ingredients: [
      { amount: 2, unit: "oz", name: "Light rum", kind: "clear", note: "Something grassy — Probitas, Planteray 3 Stars" },
      { amount: 1, unit: "oz", name: "Lime juice", kind: "citrus", note: "Squeezed within the hour" },
      { amount: 0.75, unit: "oz", name: "Simple syrup", kind: "syrup", note: "1:1" },
    ],
    steps: [
      { text: "Chill a coupe in the freezer." },
      { text: "Add everything to a shaker tin and fill with ice." },
      { text: "Shake hard until the tin frosts.", duration: 12 },
      { text: "Double strain into the chilled coupe." },
    ],
    profile: { sweet: 2, sour: 4, bitter: 0, strong: 3, body: 2 },
  },
  {
    slug: "negroni",
    name: "Negroni",
    tagline: "Equal parts, endless arguments.",
    family: "cocktail",
    method: "stirred",
    glass: "rocks",
    ice: "large cube",
    garnish: "Orange peel",
    serves: 1,
    minutes: 2,
    ingredients: [
      { amount: 1, unit: "oz", name: "London dry gin", kind: "clear" },
      { amount: 1, unit: "oz", name: "Sweet vermouth", kind: "fortified", note: "Cocchi di Torino" },
      { amount: 1, unit: "oz", name: "Campari", kind: "liqueur" },
    ],
    steps: [
      { text: "Combine in a mixing glass with ice." },
      { text: "Stir until well chilled.", duration: 30 },
      { text: "Strain over a large cube and express an orange peel." },
    ],
    profile: { sweet: 3, sour: 0, bitter: 5, strong: 4, body: 3 },
  },
  {
    slug: "old-fashioned",
    name: "Old Fashioned",
    tagline: "Whiskey, made a little more like itself.",
    family: "cocktail",
    method: "stirred",
    glass: "rocks",
    ice: "large cube",
    garnish: "Orange & lemon peel",
    serves: 1,
    minutes: 3,
    ingredients: [
      { amount: 2, unit: "oz", name: "Bourbon or rye", kind: "spirit" },
      { amount: 1, unit: "barspoon", name: "Demerara syrup", kind: "syrup", note: "2:1" },
      { amount: 2, unit: "dash", name: "Angostura bitters", kind: "bitters" },
      { amount: 1, unit: "dash", name: "Orange bitters", kind: "bitters" },
    ],
    steps: [
      { text: "Stir everything over ice in a mixing glass.", duration: 25 },
      { text: "Strain over a large cube." },
      { text: "Express both peels over the top and drop them in." },
    ],
    profile: { sweet: 2, sour: 0, bitter: 2, strong: 5, body: 4 },
  },
  {
    slug: "paloma",
    name: "Paloma",
    tagline: "Tequila's sunny afternoon.",
    family: "cocktail",
    method: "built",
    glass: "highball",
    ice: "cubed",
    garnish: "Grapefruit wedge, salt rim",
    serves: 1,
    minutes: 2,
    ingredients: [
      { amount: 2, unit: "oz", name: "Blanco tequila", kind: "clear" },
      { amount: 0.5, unit: "oz", name: "Lime juice", kind: "citrus" },
      { amount: 0.25, unit: "oz", name: "Agave syrup", kind: "syrup" },
      { unit: "top", name: "Grapefruit soda", kind: "soda", note: "About 3 oz" },
    ],
    steps: [
      { text: "Salt half the rim of a highball." },
      { text: "Build tequila, lime and agave over ice." },
      { text: "Top with soda and give it one gentle lift with a barspoon." },
    ],
    profile: { sweet: 3, sour: 3, bitter: 1, strong: 2, body: 1 },
  },
  {
    slug: "espresso",
    name: "Espresso",
    tagline: "Eighteen grams, thirty seconds, one good morning.",
    family: "coffee",
    method: "espresso",
    glass: "cup",
    serves: 1,
    minutes: 2,
    ingredients: [
      { amount: 18, unit: "g", name: "Espresso beans", kind: "coffee", note: "Rested 7–21 days off roast" },
    ],
    brew: { dose: 18, yield: 36, time: [27, 32], temp: 93, grind: "Fine — powdered sugar" },
    steps: [
      { text: "Grind, distribute and tamp level." },
      { text: "Lock in and start the shot immediately." },
      { text: "Pull to 36 g in the cup.", duration: 30 },
      { text: "Taste. Sour → grind finer. Bitter → grind coarser." },
    ],
    profile: { sweet: 2, sour: 2, bitter: 3, strong: 5, body: 4 },
    fill: 0.45,
  },
  {
    slug: "flat-white",
    name: "Flat White",
    tagline: "A double ristretto under a velvet lid.",
    family: "coffee",
    method: "steamed",
    glass: "latte",
    serves: 1,
    minutes: 4,
    ingredients: [
      { amount: 36, unit: "g", name: "Ristretto", kind: "coffee", note: "18 g in → 36 g out" },
      { amount: 120, unit: "ml", name: "Whole milk", kind: "milk", note: "Steamed to 60 °C" },
      { amount: 20, unit: "ml", name: "Microfoam", kind: "foam" },
    ],
    brew: { dose: 18, yield: 36, time: [24, 28], temp: 93, grind: "Fine" },
    steps: [
      { text: "Pull a short double shot into the glass.", duration: 26 },
      { text: "Stretch milk briefly — just a whisper of air — then roll it.", duration: 20 },
      { text: "Pour from low and close for a thin, glossy top." },
    ],
    profile: { sweet: 3, sour: 1, bitter: 2, strong: 3, body: 4 },
  },
  {
    slug: "v60",
    name: "V60 Pour-Over",
    tagline: "Clean, bright, and patient.",
    family: "coffee",
    method: "pour-over",
    glass: "mug",
    serves: 1,
    minutes: 4,
    ingredients: [
      { amount: 15, unit: "g", name: "Light roast coffee", kind: "coffee", note: "Medium-fine" },
      { amount: 250, unit: "ml", name: "Water", kind: "water", note: "Just off the boil, 96 °C" },
    ],
    brew: { dose: 15, yield: 250, time: [150, 180], temp: 96, grind: "Medium-fine — table salt" },
    served: [{ kind: "coffee", ml: 230 }],
    steps: [
      { text: "Rinse the filter and dump the water." },
      { text: "Bloom with 45 g water and swirl.", duration: 45 },
      { text: "Pour to 150 g in slow spirals.", duration: 30 },
      { text: "Pour to 250 g, swirl, and let it draw down.", duration: 75 },
    ],
    profile: { sweet: 3, sour: 3, bitter: 1, strong: 2, body: 2 },
  },
  {
    slug: "espresso-martini",
    name: "Espresso Martini",
    tagline: "Where the two bars meet.",
    family: "cocktail",
    method: "shaken",
    glass: "martini",
    ice: "none",
    garnish: "Three coffee beans",
    serves: 1,
    minutes: 4,
    ingredients: [
      { amount: 1.5, unit: "oz", name: "Vodka", kind: "clear" },
      { amount: 1, unit: "oz", name: "Fresh espresso", kind: "coffee", note: "Cooled slightly" },
      { amount: 0.5, unit: "oz", name: "Coffee liqueur", kind: "liqueur" },
      { amount: 0.25, unit: "oz", name: "Demerara syrup", kind: "syrup" },
    ],
    steps: [
      { text: "Pull a shot and let it sit for a minute." },
      { text: "Shake everything hard with ice to build the crema.", duration: 15 },
      { text: "Fine strain and float three beans." },
    ],
    profile: { sweet: 3, sour: 0, bitter: 3, strong: 3, body: 3 },
  },
];

export function getRecipe(slug: string) {
  return recipes.find((r) => r.slug === slug);
}
