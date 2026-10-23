"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  TargetIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RecipePersonal } from "@/components/recipe-personal";
import { RecipeGlass } from "@/components/ui/glass";
import { MugMark } from "@/components/ui/logo";
import { ModeSwitch } from "@/components/ui/mode-switch";
import { IngredientList } from "@/components/ui/ingredient-list";
import { BrewSpecGrid } from "@/components/ui/stat";
import { Swatch } from "@/components/ui/swatch";
import type { ResolvedRecipe, Timer } from "@/lib/content/schema";
import { soundAlarm, unlockAudio } from "@/lib/guided/alarm";
import {
  countdownsToAlert,
  displaySeconds,
  isFinished,
  isRunning,
  newSession,
  pauseTimer,
  resumableSession,
  startTimer,
  type Session,
  type TimerState,
} from "@/lib/guided/session";
import { useWakeLock } from "@/lib/guided/wake-lock";
import { deleteItem, getItem, setItem } from "@/lib/local-db";
import { usePreference } from "@/lib/preferences";
import {
  formatDuration,
  formatIngredient,
  formatTarget,
  quantityParts,
  scaleQuantity,
  partSizeMl,
  VOLUME_DISPLAYS,
  renderStepText,
  stepIngredientIds,
  type DisplayOptions,
  type TemperatureUnit,
  type VolumeDisplay,
} from "@/lib/recipe/format";
import { cn } from "@/lib/utils";

const SWIPE_PX = 60;

/** Full-screen, step-by-step "Make it" mode. */
export function GuidedMode({ recipe }: { recipe: ResolvedRecipe }) {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [now, setNow] = useState(0);
  const [flashes, setFlashes] = useState(0);
  const [volume] = usePreference<VolumeDisplay>(
    "volume-unit",
    VOLUME_DISPLAYS,
    "oz",
  );
  const [temperature] = usePreference<TemperatureUnit>(
    "temperature-unit",
    ["C", "F"],
    "C",
  );

  useWakeLock(true);

  // Pick up a saved session, or start a new one with the servings chosen on
  // the recipe page.
  useEffect(() => {
    let current = true;
    void getItem<Session>("sessions", recipe.id).then((saved) => {
      if (!current) return;
      const time = Date.now();
      const servings = Number(searchParams.get("servings") ?? recipe.serves);
      setNow(time);
      setSession(
        resumableSession(saved, recipe, time) ??
          newSession(recipe, servings, time),
      );
    });
    return () => {
      current = false;
    };
  }, [recipe, searchParams]);

  useEffect(() => {
    if (!session) return;
    void (session.phase === "done"
      ? deleteItem("sessions", recipe.id)
      : setItem("sessions", recipe.id, session));
  }, [recipe.id, session]);

  const update = useCallback((change: (session: Session) => Session) => {
    setSession(
      (previous) => previous && { ...change(previous), updatedAt: Date.now() },
    );
  }, []);

  // While a timer runs, re-render a few times a second and sound the alarm
  // for any countdown that has run out, including one that finished while
  // the phone was asleep.
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  });
  const ticking =
    session !== null &&
    recipe.steps.some(({ timer }, index) => {
      const state = session.timers[index];
      return (
        timer &&
        isRunning(state) &&
        (timer.kind === "stopwatch" || !state.alerted)
      );
    });
  useEffect(() => {
    if (!ticking) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      const current = sessionRef.current;
      if (!current) return;
      const due = countdownsToAlert(recipe, current, time);
      if (due.length === 0) return;
      soundAlarm();
      setFlashes((count) => count + 1);
      update((s) => {
        const timers = { ...s.timers };
        for (const index of due)
          timers[index] = { ...timers[index], alerted: true };
        return { ...s, timers };
      });
    };
    tick();
    const interval = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ticking, recipe, update]);

  const goTo = useCallback(
    (step: number) => {
      update((s) => {
        const timer = recipe.steps[step].timer;
        const timers =
          timer?.autoStart && !s.timers[step]
            ? { ...s.timers, [step]: startTimer(undefined, Date.now()) }
            : s.timers;
        return { ...s, phase: "steps", step, timers };
      });
    },
    [recipe, update],
  );

  const next = useCallback(() => {
    if (!session) return;
    if (session.step < recipe.steps.length - 1) goTo(session.step + 1);
    else update((s) => ({ ...s, phase: "done" }));
  }, [session, recipe, goTo, update]);

  const back = useCallback(() => {
    if (!session) return;
    if (session.step > 0) goTo(session.step - 1);
    else update((s) => ({ ...s, phase: "prep" }));
  }, [session, goTo, update]);

  useEffect(() => {
    if (session?.phase !== "steps") return;
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea")
      )
        return;
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session?.phase, next, back]);

  if (!session) return <div className="fixed inset-0 z-40 bg-paper" />;

  const options: DisplayOptions = {
    scale: session.servings / recipe.serves,
    volume: recipe.type === "cocktail" ? volume : undefined,
    partMl: partSizeMl(recipe.ingredients),
  };

  return (
    // Any tap unlocks audio, so the countdown alarm can beep later.
    <div
      className="fixed inset-0 z-40 flex flex-col bg-paper pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onPointerDown={unlockAudio}
    >
      {flashes > 0 && (
        <div
          key={flashes}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 bg-brand opacity-0 motion-safe:animate-flash"
        />
      )}

      {session.phase === "prep" && (
        <Prep
          recipe={recipe}
          session={session}
          options={options}
          temperature={temperature}
          onToggle={(item, checked) =>
            update((s) => ({
              ...s,
              checked: checked
                ? [...s.checked, item]
                : s.checked.filter((c) => c !== item),
            }))
          }
          onStart={() => goTo(0)}
        />
      )}

      {session.phase === "steps" && (
        <StepScreen
          recipe={recipe}
          session={session}
          now={now}
          options={options}
          onNext={next}
          onBack={back}
          onTimer={(change) =>
            update((s) => {
              const timers = { ...s.timers };
              const state = change(timers[s.step], Date.now());
              if (state) timers[s.step] = state;
              else delete timers[s.step];
              return { ...s, timers };
            })
          }
        />
      )}

      {session.phase === "done" && (
        <Done
          recipe={recipe}
          options={options}
          onAgain={() =>
            setSession(newSession(recipe, session.servings, Date.now()))
          }
        />
      )}
    </div>
  );
}

function Header({
  recipe,
  children,
}: {
  recipe: ResolvedRecipe;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface px-4 py-3 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-x-3 gap-y-2">
        <MugMark className="size-7 shrink-0" />
        <p className="min-w-0 flex-1 truncate text-sm font-bold">
          {recipe.name}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Exit"
          nativeButton={false}
          render={<Link href={`/recipes/${recipe.id}`} />}
        >
          <XIcon />
        </Button>
        <div className="flex w-full items-center justify-between gap-3">
          <div className="measure text-xs text-ink-muted">
            {children ?? "Make it your own"}
          </div>
          <ModeSwitch />
        </div>
      </div>
    </header>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <footer className="border-t border-line bg-surface px-4 py-3 sm:px-6">
      <div className="mx-auto flex w-full max-w-xl gap-3">{children}</div>
    </footer>
  );
}

const BIG_BUTTON = "h-12 flex-1 text-base";

function Prep({
  recipe,
  session,
  options,
  temperature,
  onToggle,
  onStart,
}: {
  recipe: ResolvedRecipe;
  session: Session;
  options: DisplayOptions;
  temperature: TemperatureUnit;
  onToggle: (item: string, checked: boolean) => void;
  onStart: () => void;
}) {
  const item = (key: string, label: ReactNode) => (
    <li key={key} className="border-b border-line last:border-0">
      <label className="flex min-h-12 cursor-pointer items-center gap-3 py-3">
        <Checkbox
          checked={session.checked.includes(key)}
          onCheckedChange={(checked) => onToggle(key, checked)}
        />
        <span className="min-w-0 flex-1">{label}</span>
      </label>
    </li>
  );

  return (
    <>
      <Header recipe={recipe}>Preparation</Header>
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Before you start</p>
              <h1 className="text-4xl font-bold tracking-tight">Get ready</h1>
            </div>
            <RecipeGlass recipe={recipe} size={72} />
          </div>
          <p className="measure mt-2 text-sm text-ink-muted">
            {session.servings} {session.servings === 1 ? "serving" : "servings"}
          </p>
          {options.volume === "parts" && options.partMl && (
            <p className="mt-3 text-sm text-ink-muted">
              Use a full jigger as 1 part and the same measure throughout. Your
              jigger size sets the drink size.
            </p>
          )}

          <h2 className="eyebrow mt-8">Ingredients</h2>
          <ul className="mt-2">
            {recipe.ingredients.map((line) => {
              const amount = quantityParts(scaleQuantity(line, options));
              return item(
                `ingredient:${line.ingredient}`,
                <>
                  <span className="grid grid-cols-[4.5rem_1fr] items-baseline gap-3">
                    <span className="measure text-right font-semibold">
                      {amount.value}
                      <span className="ml-1 text-xs font-normal text-ink-muted">
                        {amount.unit}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Swatch category={line.category} />
                      <span className="font-medium">{line.name}</span>
                      {line.optional && (
                        <Badge variant="outline">optional</Badge>
                      )}
                    </span>
                  </span>
                  {(line.note || line.unit === "to-taste") && (
                    <span className="mt-1 block pl-[5.25rem] text-sm text-ink-muted">
                      {[line.unit === "to-taste" ? "to taste" : null, line.note]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  )}
                </>,
              );
            })}
          </ul>

          {recipe.brew && (
            <BrewSpecGrid
              recipe={recipe}
              temperature={temperature}
              scale={options.scale}
              className="mt-6"
            />
          )}

          <h2 className="eyebrow mt-8">Equipment</h2>
          <ul className="mt-2">
            {recipe.equipment.map((thing) =>
              item(
                `equipment:${thing}`,
                <span className="text-lg">{thing}</span>,
              ),
            )}
            {recipe.glass &&
              item(
                `glass:${recipe.glass}`,
                <span className="text-lg">{recipe.glass}</span>,
              )}
          </ul>
        </div>
      </main>
      <Footer>
        <Button size="lg" className={BIG_BUTTON} onClick={onStart}>
          Start
        </Button>
      </Footer>
    </>
  );
}

function StepScreen({
  recipe,
  session,
  now,
  options,
  onNext,
  onBack,
  onTimer,
}: {
  recipe: ResolvedRecipe;
  session: Session;
  now: number;
  options: DisplayOptions;
  onNext: () => void;
  onBack: () => void;
  onTimer: (
    change: (
      state: TimerState | undefined,
      now: number,
    ) => TimerState | undefined,
  ) => void;
}) {
  const step = recipe.steps[session.step];
  const total = recipe.steps.length;
  const last = session.step === total - 1;
  const referenced = stepIngredientIds(step.text)
    .map((id) => recipe.ingredients.find((line) => line.ingredient === id))
    .filter((line) => line !== undefined);

  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  return (
    <>
      <Header recipe={recipe}>
        <span className="measure text-xs text-ink-muted">
          Step {session.step + 1} of {total}
        </span>
      </Header>
      <Progress
        value={((session.step + 1) / total) * 100}
        aria-label={`Step ${session.step + 1} of ${total}`}
        className="shrink-0 rounded-none"
      />

      <main
        className="flex flex-1 touch-pan-y flex-col overflow-y-auto px-6 py-8"
        onPointerDown={(event) => {
          if (event.pointerType === "touch")
            swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5)
            return;
          if (dx < 0) onNext();
          else onBack();
        }}
      >
        <div
          key={session.step}
          className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8"
        >
          <p
            aria-live="polite"
            className="text-3xl leading-snug font-bold tracking-tight text-balance sm:text-4xl"
          >
            {renderStepText(step.text, recipe.ingredients, options)}
          </p>

          {referenced.length > 0 && (
            <IngredientList
              ingredients={referenced}
              options={options}
              className="rounded-card border border-line bg-surface px-4"
            />
          )}

          {step.target && (
            <p className="measure flex items-center gap-3 rounded-control bg-brand-wash p-4 text-xl font-semibold">
              <TargetIcon className="size-6 text-ink-muted" />
              {formatTarget(step.target, recipe.ingredients, options)}
            </p>
          )}

          {step.timer && (
            <TimerControl
              timer={step.timer}
              state={session.timers[session.step]}
              now={now}
              onChange={onTimer}
            />
          )}
        </div>
      </main>

      <Footer>
        <Button
          variant="outline"
          size="lg"
          className={BIG_BUTTON}
          onClick={onBack}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Back
        </Button>
        <Button size="lg" className={BIG_BUTTON} onClick={onNext}>
          {last ? "Finish" : "Next"}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </Footer>
    </>
  );
}

function TimerControl({
  timer,
  state,
  now,
  onChange,
}: {
  timer: Timer;
  state: TimerState | undefined;
  now: number;
  onChange: (
    change: (
      state: TimerState | undefined,
      now: number,
    ) => TimerState | undefined,
  ) => void;
}) {
  const running = isRunning(state);
  const finished = isFinished(timer, state, now);
  const seconds = displaySeconds(timer, state, now);
  const overTarget = timer.kind === "stopwatch" && seconds >= timer.seconds;

  return (
    <section
      aria-label="Timer"
      className="mt-auto flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-5 sm:p-6"
    >
      {timer.kind === "stopwatch" && (
        <p className="text-sm text-ink-muted">
          Aim for {formatDuration(timer.seconds)}
        </p>
      )}
      <p
        role="timer"
        className={cn(
          "measure text-6xl font-medium sm:text-7xl",
          (finished || overTarget) &&
            "text-success underline decoration-4 underline-offset-8",
        )}
      >
        {formatDuration(seconds)}
      </p>
      <p className="eyebrow">
        {timer.kind === "countdown" ? "Time remaining" : "Time elapsed"}
      </p>
      <Progress
        value={Math.min(
          100,
          (timer.kind === "countdown"
            ? 1 - seconds / timer.seconds
            : seconds / timer.seconds) * 100,
        )}
        aria-label="Timer progress"
        className="w-full max-w-xs"
      />
      {finished && (
        <p role="alert" className="text-lg font-medium">
          Time&apos;s up
        </p>
      )}
      <div className="flex w-full max-w-xs gap-3">
        {!finished && (
          <Button
            size="lg"
            className={BIG_BUTTON}
            onClick={() =>
              onChange((current, time) =>
                current && isRunning(current)
                  ? pauseTimer(current, time)
                  : startTimer(current, time),
              )
            }
          >
            {running ? (
              <PauseIcon data-icon="inline-start" />
            ) : (
              <PlayIcon data-icon="inline-start" />
            )}
            {running ? "Pause" : state ? "Resume" : "Start"}
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          className={BIG_BUTTON}
          disabled={!state}
          onClick={() => onChange(() => undefined)}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Reset
        </Button>
      </div>
    </section>
  );
}

function Done({
  recipe,
  options,
  onAgain,
}: {
  recipe: ResolvedRecipe;
  options: DisplayOptions;
  onAgain: () => void;
}) {
  const garnishes = recipe.ingredients.filter(
    (line) => line.category === "garnish",
  );

  return (
    <>
      <Header recipe={recipe}>All done</Header>
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="mb-6 flex justify-center rounded-card border border-line bg-sunken py-6">
            <RecipeGlass recipe={recipe} size={112} />
          </div>
          <p className="eyebrow mb-2">Made by you</p>
          <h1 className="text-4xl font-bold tracking-tight">
            Enjoy your {recipe.name}
          </h1>
          <ul className="mt-4 space-y-1 text-lg">
            {recipe.glass && <li>Serve in a {recipe.glass}.</li>}
            {garnishes.map((line) => (
              <li key={line.ingredient}>
                Garnish: {formatIngredient(line, options)}.
              </li>
            ))}
            {recipe.type === "coffee" && (
              <li>Serve right away, while it&apos;s hot.</li>
            )}
          </ul>

          <div className="mt-8">
            <RecipePersonal recipeId={recipe.id} />
          </div>
        </div>
      </main>
      <Footer>
        <Button
          variant="outline"
          size="lg"
          className={BIG_BUTTON}
          nativeButton={false}
          render={<Link href={`/recipes/${recipe.id}`} />}
        >
          Done
        </Button>
        <Button size="lg" className={BIG_BUTTON} onClick={onAgain}>
          Make it again
        </Button>
      </Footer>
    </>
  );
}
