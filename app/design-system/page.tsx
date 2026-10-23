import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getRecipe } from "@/lib/content/load";
import type { Unit } from "@/lib/content/schema";
import { quantityParts, scaleQuantity, type VolumeUnit } from "@/lib/recipe/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GlassFill,
  glassLabel,
  glassNames,
  RecipeGlass,
  type GlassName,
} from "@/components/ui/glass";
import { liquids } from "@/components/ui/swatch";
import { RecipeWorkbench } from "@/components/ui/recipe-workbench";
import { RatioBar } from "@/components/ui/ratio-bar";
import { StepList } from "@/components/ui/step-list";
import { BrewSpecGrid, Stat } from "@/components/ui/stat";
import { FlavorProfile } from "@/components/ui/flavor-profile";
import { BrewTimer } from "@/components/ui/brew-timer";
import { RecipeCard } from "@/components/ui/recipe-card";
import { SiteHeader } from "@/components/site-header";
import { StepperDemo, ToggleGroupDemo } from "./demos";

export const metadata: Metadata = { title: "Design system" };

const sidecar = getRecipe("sidecar")!;
const frenchPress = getRecipe("french-press")!;

const NAV = [
  ["principles", "Principles"],
  ["modes", "Modes"],
  ["color", "Color"],
  ["type", "Type"],
  ["measures", "Measures"],
  ["glassware", "Glassware"],
  ["components", "Components"],
  ["shape", "Shape"],
] as const;

export default function DesignSystemPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-14">
        <p className="eyebrow">Mugshot design system</p>
        <h1 className="mt-2 max-w-3xl text-5xl font-bold tracking-tight text-balance">
          Black, white and grapefruit.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-muted">
          A system for people who just want a good drink at home. A calm black
          and white base you can rely on, and one bright accent to keep it fun.
        </p>
        <nav className="mt-8 flex flex-wrap gap-2">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted hover:border-line-strong hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* ---------------------------------------------------------------- */}
        <Section id="principles" title="Principles">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Principle n="01" title="Numbers first">
              Amounts lead every row in a fixed mono column. You should be able
              to read a spec with sticky fingers from arm&apos;s length.
            </Principle>
            <Principle n="02" title="Two rooms">
              Café and Bar are modes, not themes. Tokens swap; layout, type and
              components never do. Modes can scope to any subtree.
            </Principle>
            <Principle n="03" title="Dependable">
              Black and white carry the interface. Plain words, steady layouts,
              no jargon. It should feel like a recipe card you trust.
            </Principle>
            <Principle n="04" title="One accent">
              Grapefruit is the fun part, so use it sparingly: the logo, tags,
              highlights and progress. Buttons stay black.
            </Principle>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="modes"
          title="Modes"
          lede={
            <>
              Set <Code>data-mode=&quot;cafe&quot;</Code> or{" "}
              <Code>data-mode=&quot;bar&quot;</Code> on any element. With no
              attribute, the system color scheme decides. Every token is a{" "}
              <Code>light-dark()</Code> pair, so nesting just works.
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["cafe", "Café", "White · black ink · grapefruit", frenchPress],
                ["bar", "Bar", "Black · white ink · grapefruit", sidecar],
              ] as const
            ).map(([mode, name, desc, recipe]) => (
              <div
                key={mode}
                data-mode={mode}
                className="rounded-card border border-line bg-paper p-6 text-ink"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-bold tracking-tight">{name}</h3>
                  <span className="text-xs text-ink-muted">{desc}</span>
                </div>
                <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-5">
                  <RecipeGlass recipe={recipe} size={88} />
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm">Start timer</Button>
                      <Button size="sm" variant="outline">
                        Save
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="brand" className="capitalize">
                        {recipe.method}
                      </Badge>
                      {recipe.glass && (
                        <Badge variant="outline">
                          {glassLabel[recipe.glass as GlassName] ?? recipe.glass}
                        </Badge>
                      )}
                    </div>
                    <RatioBar
                      ingredients={recipe.ingredients}
                      showLegend={false}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="color"
          title="Color"
          lede="Semantic tokens only — components never reference a hex value. Utilities are generated as bg-surface, text-ink-muted, border-line and so on."
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <TokenGroup
              title="Surfaces"
              tokens={[
                "paper",
                "surface",
                "surface-raised",
                "sunken",
                "line",
                "line-strong",
              ]}
            />
            <TokenGroup
              title="Ink"
              tokens={["ink", "ink-muted", "ink-faint"]}
            />
            <TokenGroup
              title="Brand"
              tokens={["brand", "brand-strong", "brand-wash", "brand-ink"]}
            />
            <TokenGroup
              title="Feedback"
              tokens={["success", "warning", "danger"]}
            />
          </div>

          <h3 className="eyebrow mt-12 mb-4">Liquid palette</h3>
          <p className="mb-5 max-w-2xl text-sm text-ink-muted">
            Keyed to ingredient category, not brand. Used by the glass
            illustration, ratio bars and ingredient swatches — the only place
            saturated color appears in the UI.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {liquids.map((liquid) => (
              <div key={liquid} className="flex items-center gap-3">
                <Droplet color={`var(--liquid-${liquid})`} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium capitalize">
                    {liquid}
                  </div>
                  <div className="measure truncate text-[11px] text-ink-faint">
                    liquid-{liquid}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section id="type" title="Type">
          <div className="divide-y divide-line rounded-card border border-line bg-surface">
            <TypeRow
              token="font-display"
              spec="Inter Tight · bold, tight tracking"
            >
              <span className="text-5xl font-bold tracking-tight">
                Espresso Martini
              </span>
            </TypeRow>
            <TypeRow token="font-sans" spec="Inter Tight · UI and prose">
              <span className="text-lg">
                Shake hard until the tin frosts, then double strain.
              </span>
            </TypeRow>
            <TypeRow token="measure" spec="JetBrains Mono · tabular figures">
              <span className="measure text-2xl">
                ¾ oz · 25 ml · 1:15 · 4:00 · 95 °C
              </span>
            </TypeRow>
            <TypeRow token="eyebrow" spec="11 / 0.14em / uppercase">
              <span className="eyebrow">Dial-in</span>
            </TypeRow>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="measures"
          title="Measures"
          lede="Recipes store amounts as written and convert at display time, in lib/recipe/format.ts. Volumes round to the nearest ¼ oz, or 5 ml (2.5 ml below 15). Grams never convert. Dashes round to whole numbers when scaled; barspoons and pieces to halves."
        >
          <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-line">
                  {["Stored", "oz", "ml", "× 3 batch"].map((h) => (
                    <th key={h} className="eyebrow px-5 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="measure divide-y divide-line">
                {MEASURES.map((m, i) => (
                  <tr key={i}>
                    <td className="px-5 py-2.5 text-ink-muted">
                      {m.amount === undefined ? m.unit : `${m.amount} ${m.unit}`}
                    </td>
                    {MEASURE_COLUMNS.map(([volume, scale], j) => {
                      const f = quantityParts(scaleQuantity(m, { scale, volume }));
                      return (
                        <td key={j} className="px-5 py-2.5">
                          {f.value || "—"}
                          {f.unit && (
                            <span className="ml-1 text-ink-muted">
                              {f.unit}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="glassware"
          title="Glassware"
          lede="Eight vessels on a 64 × 80 grid with a 1.6 stroke. Pass layers to fill; pass ice to add cubes. Scales cleanly from 24px icons to hero art."
        >
          <div className="grid grid-cols-4 gap-4 lg:grid-cols-8">
            {glassNames.map((g) => (
              <div key={g} className="flex flex-col items-center gap-3">
                <div className="flex h-28 w-full items-end justify-center rounded-control bg-sunken pb-2">
                  <GlassFill glass={g} size={64} />
                </div>
                <span className="text-xs text-ink-muted">{glassLabel[g]}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-end gap-8 rounded-card border border-line bg-surface p-6">
            <RecipeGlass recipe={sidecar} size={96} />
            <RecipeGlass recipe={frenchPress} size={96} />
            <div className="flex items-end gap-3 border-l border-line pl-8">
              {[48, 32, 24].map((s) => (
                <RecipeGlass key={s} recipe={sidecar} size={s} />
              ))}
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section id="components" title="Components">
          <div className="grid gap-6 lg:grid-cols-2">
            <Specimen
              name="Button"
              file="ui/button.tsx"
              note="shadcn Button, themed by the tokens: default is black. Grapefruit never goes on a button."
            >
              <div className="flex flex-wrap items-center gap-2">
                <Button size="lg">Default</Button>
                <Button size="lg" variant="outline">
                  Outline
                </Button>
                <Button size="lg" variant="secondary">
                  Secondary
                </Button>
                <Button size="lg" variant="ghost">
                  Ghost
                </Button>
                <Button size="sm">Small</Button>
                <Button size="lg" disabled>
                  Disabled
                </Button>
              </div>
            </Specimen>

            <Specimen
              name="Badge"
              file="ui/badge.tsx"
              note="shadcn Badge with an added brand variant for methods and highlights."
            >
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="brand">Shaken</Badge>
                <Badge variant="brand">Pour-over</Badge>
                <Badge variant="secondary">Citrus-forward</Badge>
                <Badge variant="outline">Coupe</Badge>
                <Badge variant="outline">Large cube</Badge>
              </div>
            </Specimen>

            <Specimen
              name="ToggleGroup"
              file="ui/toggle-group.tsx"
              note="shadcn ToggleGroup, outline at spacing 0. Ignore presses that would leave nothing selected."
            >
              <ToggleGroupDemo />
            </Specimen>

            <Specimen name="Stepper" file="ui/stepper.tsx">
              <StepperDemo />
            </Specimen>

            <Specimen
              name="IngredientList · RecipeWorkbench"
              file="ui/recipe-workbench.tsx"
              note="Mono amount column, liquid swatch, optional note. RecipeWorkbench adds the servings stepper and oz/ml toggle; use IngredientList on its own for a static spec."
            >
              <RecipeWorkbench ingredients={sidecar.ingredients} serves={sidecar.serves} />
            </Specimen>

            <Specimen
              name="RatioBar"
              file="ui/ratio-bar.tsx"
              note="Dashes, pieces and garnishes are seasoning, so they don't take up volume."
            >
              <div className="space-y-6">
                <RatioBar ingredients={sidecar.ingredients} />
                <RatioBar ingredients={frenchPress.ingredients} />
              </div>
            </Specimen>

            <Specimen name="Stat · BrewSpecGrid" file="ui/stat.tsx">
              <BrewSpecGrid recipe={frenchPress} />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Stat label="ABV" value="21" unit="%" />
                <Stat label="Volume" value="4¼" unit="oz" />
                <Stat label="Caffeine" value="~130" unit="mg" />
              </div>
            </Specimen>

            <Specimen
              name="FlavorProfile"
              file="ui/flavor-profile.tsx"
              note="Recipes don't carry a profile yet; these are sample values."
            >
              <div className="grid grid-cols-2 gap-8">
                <FlavorProfile
                  profile={{ sweet: 3, sour: 0, bitter: 5, strong: 4, body: 3 }}
                />
                <FlavorProfile
                  profile={{ sweet: 3, sour: 1, bitter: 2, strong: 3, body: 4 }}
                />
              </div>
            </Specimen>

            <Specimen
              name="StepList"
              file="ui/step-list.tsx"
              note="Steps with a timer or a target weight get a chip."
            >
              <StepList
                steps={frenchPress.steps}
                ingredients={frenchPress.ingredients}
              />
            </Specimen>

            <Specimen
              name="BrewTimer"
              file="ui/brew-timer.tsx"
              note="Under the window it's muted, inside it's green, past it amber."
            >
              <BrewTimer
                target={[27, 32]}
                label="Shot timer"
                className="shadow-none"
              />
            </Specimen>
          </div>

          <h3 className="eyebrow mt-12 mb-4">RecipeCard</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[sidecar, frenchPress].map((r) => (
              <RecipeCard key={r.id} recipe={r} href={`/recipes/${r.id}`} />
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section id="shape" title="Shape & elevation">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="gap-0 p-5">
              <div className="eyebrow">radius-card</div>
              <p className="measure mt-1 text-sm">12px · cards, panels</p>
            </Card>
            <div className="rounded-control border border-line bg-surface p-5">
              <div className="eyebrow">radius-control</div>
              <p className="measure mt-1 text-sm">10px · buttons, stats</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-5 shadow-lift">
              <div className="eyebrow">shadow-lift</div>
              <p className="measure mt-1 text-sm">soft · hover only</p>
            </div>
          </div>
        </Section>
      </main>
    </>
  );
}

const MEASURES: Array<{ amount?: number; unit: Unit }> = [
  { amount: 0.75, unit: "oz" },
  { amount: 1.5, unit: "oz" },
  { amount: 45, unit: "ml" },
  { amount: 18, unit: "g" },
  { amount: 2, unit: "dash" },
  { amount: 1, unit: "barspoon" },
  { amount: 1, unit: "piece" },
  { unit: "to-taste" },
];

const MEASURE_COLUMNS: Array<[VolumeUnit, number]> = [
  ["oz", 1],
  ["ml", 1],
  ["oz", 3],
];

function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-20 scroll-mt-8">
      <h2 className="text-4xl font-bold tracking-tight">{title}</h2>
      {lede && <p className="mt-2 mb-6 max-w-2xl text-ink-muted">{lede}</p>}
      <div className={lede ? "" : "mt-6"}>{children}</div>
    </section>
  );
}

function Principle({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 p-5">
      <span className="measure text-xs text-brand-strong">{n}</span>
      <h3 className="mt-2 text-xl font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{children}</p>
    </Card>
  );
}

function TokenGroup({ title, tokens }: { title: string; tokens: string[] }) {
  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tokens.map((t) => (
          <div
            key={t}
            className="overflow-hidden rounded-control border border-line"
          >
            <div className="flex h-14">
              <div
                data-mode="cafe"
                className="flex-1"
                style={{ background: `var(--${t})` }}
              />
              <div
                data-mode="bar"
                className="flex-1"
                style={{ background: `var(--${t})` }}
              />
            </div>
            <div className="measure bg-surface px-2.5 py-1.5 text-[11px] text-ink-muted">
              {t}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Droplet({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 30" className="h-8 w-6 shrink-0" aria-hidden>
      <path
        d="M12 2 C12 2 3 13 3 19 a9 9 0 0 0 18 0 C21 13 12 2 12 2 Z"
        fill={color}
        stroke="var(--ink)"
        strokeOpacity={0.15}
      />
    </svg>
  );
}

function TypeRow({
  token,
  spec,
  children,
}: {
  token: string;
  spec: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 px-6 py-5 sm:grid-cols-[12rem_1fr] sm:items-center">
      <div>
        <div className="measure text-sm">{token}</div>
        <div className="text-xs text-ink-muted">{spec}</div>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Specimen({
  name,
  file,
  note,
  children,
}: {
  name: string;
  file: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
        <h3 className="font-medium">{name}</h3>
        <span className="measure text-[11px] text-ink-faint">
          components/{file}
        </span>
      </div>
      <div className="flex-1 p-5">{children}</div>
      {note && (
        <p className="border-t border-line px-5 py-3 text-xs text-ink-muted">
          {note}
        </p>
      )}
    </Card>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="measure rounded bg-sunken px-1.5 py-0.5 text-[0.85em] text-ink">
      {children}
    </code>
  );
}
