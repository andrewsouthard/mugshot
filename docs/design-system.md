# Mugshot design system

Recipes for people who just want a good drink at home. The live reference is at
[`/design-system`](../app/design-system/page.tsx). This file covers the rules
behind it.

The same components are used throughout the app: `SiteHeader` provides the
linked logo and mode switch, search uses `RecipeCard`, and recipe pages use
`RecipeWorkbench`, `StepList`, `RatioBar`, `SpecList` and `BrewSpecGrid`.
Guided mode keeps its session-based timer behavior while sharing the ingredient
rows, glassware, progress colors and personal recipe panel. Offline and missing
pages use the same header, typography and surfaces.

## Principles

1. **Numbers first.** Amounts lead every row in a fixed mono column. A spec
   should be readable from arm's length with sticky fingers.
2. **Two rooms, one system.** Café and Bar are _modes_, not separate themes.
   Tokens change between them; layout, type and components stay the same.
3. **Dependable.** Black and white carry the interface. Use plain words and
   steady layouts, and avoid jargon. It should feel like a recipe card you
   trust, not a lab instrument.
4. **One accent.** Grapefruit is the fun part, so use it sparingly: the
   logo, tags, highlights and progress. Buttons stay black.
5. **Draw the drink.** The glass illustration is data. Each band is an
   ingredient at its real proportion. Liquid colors are the only other
   saturated color in the UI.

## Modes

| Mode | Look  | Paper     | Ink       | Accent               |
| ---- | ----- | --------- | --------- | -------------------- |
| Café | light | `#fbfbf9` | `#111111` | grapefruit `#ee6c7e` |
| Bar  | dark  | `#0e0e0e` | `#f5f5f2` | grapefruit `#f27d8d` |

- With no attribute set, the system color scheme picks the mode. Tailwind's
  `dark:` variant follows the active mode too. The header
  `ModeSwitch` stores an override in `localStorage`. An inline script in the
  layout applies it before first paint, so the page doesn't flash.
- `data-mode="cafe" | "bar"` works on **any element**, so a single page can
  show both modes side by side.
- Each token is a `light-dark()` pair. Tailwind compiles `light-dark()` into
  variables that resolve where a token is _declared_. For that reason
  `globals.css` re-declares the tokens on every `[data-mode]` element. Don't
  remove that selector.

## Tokens

All tokens live in `app/globals.css` and are exposed as Tailwind utilities.

- **Surfaces:** `paper`, `surface`, `surface-raised`, `sunken`, `line`, `line-strong`
- **Ink:** `ink`, `ink-muted`, `ink-faint`
- **Brand:** `brand`, `brand-strong`, `brand-wash` (tinted background), `brand-ink` (text on brand).
  Grapefruit takes black text when used as a fill. For small text on white,
  use `brand-strong` (`#c23f55`), because plain grapefruit is too light to
  read there. It's called "brand" because shadcn already uses `accent` for
  its subtle hover fill.
- **shadcn tokens** (`background`, `foreground`, `primary`, `muted`,
  `accent`, `border`, `ring` and so on) are mapped onto the palette above, so
  shadcn components pick up the system automatically. `primary` is ink, which
  makes the default Button black.
- **Feedback:** `success`, `warning`, `danger`
- **Liquid:** `liquid-{spirit, clear, liqueur, fortified, citrus, syrup, bitters, coffee, milk, foam, water, soda}`.
  These are keyed to the ingredient `category` in `content/ingredients.json`.
  `liquidColor()` in `components/ui/swatch.tsx` maps categories that don't
  share a name (`juice` → citrus, `sweetener` → syrup) and falls back to
  spirit. Only the glass, ratio bars and swatches use them.
- **Shape:** `rounded-card` (0.75rem), `rounded-control` (0.625rem), `shadow-lift` (hover only). Use borders, not shadows, for structure.
- **Type:** Inter Tight for everything (headings bold with tight tracking),
  plus two custom utilities: `measure` (JetBrains Mono, tabular figures, for
  every number) and `eyebrow` (11px uppercase label).

## Logo

A solid mug in ink, with a grapefruit line at the rim for the coffee. The
wordmark is "Mugshot" in Inter Tight Bold. Both live in `components/ui/logo.tsx` (`Logo`, `MugMark`).
Don't add a face, steam or other cute details: the brand is meant to feel
dependable.

Components never use raw hex values or Tailwind's stock palette.

## Measures

Recipes store amounts the way they're written (`¾ oz`, `18 g`, `2 dash`). They
are scaled and converted only for display, in `lib/recipe/format.ts`
(`scaleQuantity`, then `formatQuantity` for a string or `quantityParts` for
the number and unit separately).

- 1 oz = 30 ml, the bar convention, so specs round-trip cleanly.
- Ounces round to the nearest ¼ and display as fractions (`1½`).
- Millilitres round to 5, or 2.5 below 15 ml (¾ oz → 25 ml).
- Grams never convert, because coffee is always weighed.
- Dashes round to whole numbers when scaled; barspoons and pieces to halves.
- `to-taste` has no amount.
- Cocktails also offer **parts** for a jigger or any consistent measure. The
  first required spirit is one part (or the first required volume if there is
  no spirit). Mixed oz/ml ingredients are compared before display rounding, so
  proportions stay accurate. Parts scale with servings; dashes, barspoons,
  garnishes and grams keep their units. The saved choice also applies in guided
  mode, using the full recipe's basis for every step and pour target.

## Components

Everything is in `components/ui/`. Unless marked _client_, components are
server-safe.

| Component | Purpose |
| --- | --- |
| `Button` | shadcn; `default` (black), `outline`, `secondary`, `ghost`. Never grapefruit. |
| `Logo`, `MugMark` | wordmark and mug mark |
| `Badge` | shadcn; method, glass and flavor labels. `brand` (grapefruit) is our addition. |
| `Card` | shadcn Card (`CardHeader`, `CardContent`, …) |
| `Swatch` | liquid-colored dot for an ingredient category |
| `GlassFill`, `RecipeGlass` | glassware illustration (8 vessels, optional ice). Coffee recipes are drawn as brewed coffee. |
| `RatioBar` | proportions as a stacked bar with legend |
| `IngredientList` | the spec: mono amount column, swatch, note |
| `StepList` | numbered method with timer and target chips |
| `Stat`, `BrewSpecGrid` | dial-in numbers: dose, water, ratio, temp, grind |
| `FlavorProfile` | five 5-pip meters (recipes don't carry a profile yet) |
| `SpecList` | key/value facts: glass, ice, garnish |
| `RecipeCard` | recipe summary card; pass `href` to make it a link |
| `ToggleGroup` _(client)_ | shadcn; units, modes, filters. Use `variant="outline" spacing={0}` and ignore presses that leave nothing selected. |
| `Stepper` _(client)_ | − n + |
| `RecipeWorkbench` _(client)_ | `IngredientList` + servings stepper + oz/ml toggle |
| `BrewTimer` _(client)_ | timer with a target window: grapefruit below it, green inside, amber past it |
| `ModeSwitch` _(client)_ | Auto / Café / Bar |

## Data

`RecipeWorkbench` can manage its own state for demos, or accept `servings`,
`onServingsChange`, `volume` and `onVolumeChange` to share the recipe page's
scaling and saved unit preference. `BrewSpecGrid` accepts `scale` for dose and
water amounts; temperature and ratio stay fixed.

Components take the content types from `lib/content/schema.ts`
(`ResolvedRecipe`, `ResolvedIngredientLine`, `Step`) and use `cn` from the
`cn` package. Recipes live in `content/recipes/*.json`; see `SPEC.md` for the
format.
