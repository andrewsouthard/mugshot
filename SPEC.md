# Mugshot — spec

A public, installable PWA of home bartending and barista recipes. There is no backend: the recipes are JSON files in the repo, search runs on the device with FlexSearch, and any user data stays on the device.

## Goals

- Find a recipe fast: search as you type, plus filters.
- Make it without fuss: a guided, step-by-step mode with a timer per step.
- Works fully offline once installed.
- Static hosting on Cloudflare Pages.

## Out of scope (for now)

- "What can I make?" and bar inventory
- Accounts and cross-device sync
- Accessibility extras: text-to-speech and voice control (basic semantic HTML still applies)
- Custom visual design. We use stock shadcn/ui until the design pass.

## Architecture

- **Next.js 16 static export** (`output: 'export'`) deployed to Cloudflare Pages.
  - `next.config.ts` `headers()` isn't supported in a static export, so caching headers go in `public/_headers`. `sw.js` must be served `no-cache`.
  - The default `next/image` loader doesn't work in a static export. Illustrations are SVGs served as-is.
- **Content**
  - One file per recipe in `content/recipes/*.json`, plus the ingredient catalog in `content/ingredients.json`.
  - A zod schema checks everything at build time, and the build fails on errors:
    - every ingredient ID exists in the catalog;
    - every `{placeholder}` in step text resolves;
    - recipe IDs are unique and match their file names.
- **Build output**
  - One static page per recipe at `/recipes/[id]`, with JSON-LD `Recipe` data and Open Graph tags.
  - `recipes.json`: every recipe in one bundle, with the ingredient catalog already resolved and a content hash for versioning.
- **Search:** a FlexSearch `Document` index built on the device from `recipes.json`. Field weights: name > ingredient names > tags > description.
- **Offline:** a hand-written service worker pre-caches the app shell, `recipes.json`, every recipe page and the illustrations. When the content hash changes, it shows an "update available" prompt.
- **Local data** (favorites, notes, preferred units, guided sessions in progress): IndexedDB, with localStorage for small preferences.
- **UI:** stock shadcn/ui on Tailwind 4, dark mode following the system setting.

## Data model

### Ingredient (`content/ingredients.json`)

| field      | type   | notes                                                           |
| ---------- | ------ | --------------------------------------------------------------- |
| `id`       | string | kebab-case, referenced by recipes                               |
| `name`     | string | display name, lowercase unless it's a proper noun               |
| `category` | string | spirit, liqueur, juice, sweetener, garnish, coffee, water, etc. |

### Recipe (`content/recipes/<id>.json`)

| field         | type                       | notes                                                   |
| ------------- | -------------------------- | ------------------------------------------------------- |
| `id`          | string                     | must match the file name                                |
| `name`        | string                     |                                                         |
| `type`        | `"cocktail"` \| `"coffee"` |                                                         |
| `description` | string                     | one or two sentences                                    |
| `tags`        | string[]                   |                                                         |
| `serves`      | number                     | the base yield that amounts are written for             |
| `method`      | string                     | shake, stir, build, immersion, pour-over, espresso…     |
| `glass`       | string?                    | cocktails                                               |
| `equipment`   | string[]                   | shown on the prep checklist                             |
| `brew`        | object?                    | coffee: `ratio`, `waterTempC`, `grind`                  |
| `ingredients` | Ingredient line[]          | see below                                               |
| `steps`       | Step[]                     | see below                                               |
| `illustration`| string \| null             | path under `public/illustrations/`                      |
| `source`      | `{ name, url? }`           | credit the source. The step text must be our own words. |

**Ingredient line:** `{ ingredient, amount?, unit, note?, optional? }`
- `unit` is one of `oz`, `ml`, `g`, `dash`, `barspoon`, `piece`, `to-taste`.
- `amount` is left out for `to-taste`.

**Step:** `{ text, timer?, target? }`
- `text` can contain `{ingredient-id}` placeholders. They render as the scaled, unit-converted amount and name, e.g. `{cognac}` becomes "1½ oz cognac".
- `timer`: `{ kind: "countdown" | "stopwatch", seconds, autoStart }`
  - `countdown` counts down from `seconds`.
  - `stopwatch` counts up, with `seconds` as the target (for pour-over stages later).
  - Timers **don't** scale with servings.
- `target`: `{ ingredient, amount, unit }`, a weight or volume to reach during the step, e.g. "pour to 450 g". Targets **do** scale with servings.

### Scaling and units

- Scale factor = chosen servings ÷ `serves`. It applies to ingredient amounts and step targets.
- Cocktails: toggle between oz and ml (1 oz = 30 ml, rounded to practical jigger amounts). Oz amounts display as fractions (¼, ½, ¾).
- Coffee: always grams. Water temperature has a °C/°F toggle.

## Features

### Browse and search
- Home: a search box and filter chips (type, method, tags, glass), with recipes shown as a card grid.
- Results update as you type. Matching is by prefix and tolerates typos.
- The query and filters live in the URL so a search can be shared.

### Recipe page
- Illustration, name, description and tags
- A servings stepper and a unit toggle
- Ingredient list, equipment and steps, with placeholders rendered
- A **Make it** button that opens guided mode
- A favorite toggle and personal notes, stored on the device

### Guided mode ("Make it")

Route: `/recipes/[id]/make`. It's full screen, and the screen stays on (Wake Lock) for the whole session.

1. **Prep:** a checklist of scaled ingredients and equipment. A Start button begins the steps.
2. **Steps:** one step per screen.
   - Large text, with the ingredients the step references shown with their amounts.
   - Next/back buttons, swipe, and a progress indicator.
   - If the step has a timer, it gets a big start/pause/reset control. `autoStart` timers begin when you arrive on the step.
   - When a countdown finishes: a beep (Web Audio), vibration where supported (iOS Safari has none), and a visual flash. It doesn't move to the next step on its own.
   - Timers are computed from the time they started, not from counting ticks, so they stay accurate when the phone sleeps or you switch apps.
3. **Done:** a serve/garnish reminder, then add a note, favorite it, or make it again.

The session (recipe, servings, current step, timer start time) is saved locally, so a refresh or app switch picks up where you left off.

## Build order

1. **Foundation:**
   - static export config and Cloudflare `_headers`
   - shadcn init
   - zod schema, content loader and build-time checks
   - `recipes.json` generation
2. **Recipe pages:** static `/recipes/[id]` with scaling, units, JSON-LD and OG tags.
3. **Search:** home page with the FlexSearch index and filters.
4. **Guided mode:** prep checklist, step screens, timers, wake lock, saving and resuming the session.
5. **Offline:** service worker pre-caching, update prompt, manifest and icons, then an install test on iOS and Android.
6. **Local data:** favorites and notes.
7. **Content:** grow from 2 recipes to about 10, with illustrations.

## Starter content

- `content/recipes/sidecar.json`: shaken cocktail, optional ingredient, garnish, a 12-second countdown that you start by hand.
- `content/recipes/french-press.json`: coffee, brew settings, a pour target, two countdowns that start automatically.

Between them they exercise every schema feature except `stopwatch`.
