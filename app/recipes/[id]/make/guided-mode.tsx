"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  TargetIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
import { useFavorite, useNote } from "@/lib/local-data";
import { usePreference } from "@/lib/preferences";
import {
  formatDuration,
  formatIngredient,
  formatTarget,
  formatTemperature,
  renderStepText,
  stepIngredientIds,
  type DisplayOptions,
  type TemperatureUnit,
  type VolumeUnit,
} from "@/lib/recipe/format";
import { cn } from "@/lib/utils";

const SWIPE_PX = 60;

/** Full-screen, step-by-step "Make it" mode. */
export function GuidedMode({ recipe }: { recipe: ResolvedRecipe }) {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [now, setNow] = useState(0);
  const [flashes, setFlashes] = useState(0);
  const [volume] = usePreference<VolumeUnit>("volume-unit", ["oz", "ml"], "oz");
  const [temperature] = usePreference<TemperatureUnit>("temperature-unit", ["C", "F"], "C");

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
      setSession(resumableSession(saved, recipe, time) ?? newSession(recipe, servings, time));
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
    setSession((previous) => previous && { ...change(previous), updatedAt: Date.now() });
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
      return timer && isRunning(state) && (timer.kind === "stopwatch" || !state.alerted);
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
        for (const index of due) timers[index] = { ...timers[index], alerted: true };
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
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea")) return;
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session?.phase, next, back]);

  if (!session) return <div className="fixed inset-0 z-40 bg-background" />;

  const options: DisplayOptions = {
    scale: session.servings / recipe.serves,
    volume: recipe.type === "cocktail" ? volume : undefined,
  };

  return (
    // Any tap unlocks audio, so the countdown alarm can beep later.
    <div
      className="fixed inset-0 z-40 flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      onPointerDown={unlockAudio}
    >
      {flashes > 0 && (
        <div
          key={flashes}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 bg-primary opacity-0 motion-safe:animate-flash"
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
              checked: checked ? [...s.checked, item] : s.checked.filter((c) => c !== item),
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
          onAgain={() => setSession(newSession(recipe, session.servings, Date.now()))}
        />
      )}
    </div>
  );
}

function Header({ recipe, children }: { recipe: ResolvedRecipe; children?: ReactNode }) {
  return (
    <header className="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Exit"
        nativeButton={false}
        render={<Link href={`/recipes/${recipe.id}`} />}
      >
        <XIcon />
      </Button>
      <p className="truncate text-sm font-medium">{recipe.name}</p>
      <div className="ml-auto flex items-center gap-3">{children}</div>
    </header>
  );
}

function Footer({ children }: { children: ReactNode }) {
  return <footer className="flex gap-3 border-t px-4 py-3">{children}</footer>;
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
    <li key={key}>
      <label className="flex min-h-11 items-center gap-3">
        <Checkbox
          checked={session.checked.includes(key)}
          onCheckedChange={(checked) => onToggle(key, checked)}
        />
        <span className="flex flex-wrap items-baseline gap-x-2">{label}</span>
      </label>
    </li>
  );

  return (
    <>
      <Header recipe={recipe} />
      <main className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">Get ready</h1>
          <p className="mt-1 text-muted-foreground">
            {session.servings} {session.servings === 1 ? "serving" : "servings"}
          </p>

          <h2 className="mt-8 font-semibold">Ingredients</h2>
          <ul className="mt-2">
            {recipe.ingredients.map((line) =>
              item(
                `ingredient:${line.ingredient}`,
                <>
                  <span className="text-lg">{formatIngredient(line, options)}</span>
                  {line.note && <span className="text-sm text-muted-foreground">{line.note}</span>}
                  {line.optional && <Badge variant="outline">optional</Badge>}
                </>,
              ),
            )}
          </ul>

          {recipe.brew && (
            <p className="mt-4 text-muted-foreground">
              Grind {recipe.brew.grind}, water at{" "}
              {formatTemperature(recipe.brew.waterTempC, temperature)}.
            </p>
          )}

          <h2 className="mt-8 font-semibold">Equipment</h2>
          <ul className="mt-2">
            {recipe.equipment.map((thing) =>
              item(`equipment:${thing}`, <span className="text-lg">{thing}</span>),
            )}
            {recipe.glass && item(`glass:${recipe.glass}`, <span className="text-lg">{recipe.glass}</span>)}
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
  onTimer: (change: (state: TimerState | undefined, now: number) => TimerState | undefined) => void;
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
        <span className="text-sm text-muted-foreground tabular-nums">
          Step {session.step + 1} of {total}
        </span>
      </Header>
      <Progress
        value={((session.step + 1) / total) * 100}
        aria-label={`Step ${session.step + 1} of ${total}`}
        className="px-4"
      />

      <main
        className="flex flex-1 touch-pan-y flex-col overflow-y-auto px-6 py-8"
        onPointerDown={(event) => {
          if (event.pointerType === "touch") swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          if (dx < 0) onNext();
          else onBack();
        }}
      >
        <div key={session.step} className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8">
          <p aria-live="polite" className="text-3xl leading-snug font-medium text-balance">
            {renderStepText(step.text, recipe.ingredients, options)}
          </p>

          {referenced.length > 0 && (
            <ul className="space-y-1 text-lg text-muted-foreground">
              {referenced.map((line) => (
                <li key={line.ingredient}>{formatIngredient(line, options)}</li>
              ))}
            </ul>
          )}

          {step.target && (
            <p className="flex items-center gap-3 text-2xl font-semibold">
              <TargetIcon className="size-6 text-muted-foreground" />
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
        <Button variant="outline" size="lg" className={BIG_BUTTON} onClick={onBack}>
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
  onChange: (change: (state: TimerState | undefined, now: number) => TimerState | undefined) => void;
}) {
  const running = isRunning(state);
  const finished = isFinished(timer, state, now);
  const seconds = displaySeconds(timer, state, now);
  const overTarget = timer.kind === "stopwatch" && seconds >= timer.seconds;

  return (
    <section aria-label="Timer" className="mt-auto flex flex-col items-center gap-4 rounded-xl border p-6">
      {timer.kind === "stopwatch" && (
        <p className="text-sm text-muted-foreground">Aim for {formatDuration(timer.seconds)}</p>
      )}
      <p
        role="timer"
        className={cn(
          "text-7xl font-semibold tabular-nums",
          (finished || overTarget) && "text-primary underline decoration-4 underline-offset-8",
        )}
      >
        {formatDuration(seconds)}
      </p>
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
                current && isRunning(current) ? pauseTimer(current, time) : startTimer(current, time),
              )
            }
          >
            {running ? <PauseIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
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
  const [favorite, setFavorite] = useFavorite(recipe.id);
  const [note, setNote] = useNote(recipe.id);
  const garnishes = recipe.ingredients.filter((line) => line.category === "garnish");

  return (
    <>
      <Header recipe={recipe} />
      <main className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mx-auto max-w-xl">
          <h1 className="text-3xl font-semibold tracking-tight">Enjoy your {recipe.name}</h1>
          <ul className="mt-4 space-y-1 text-lg">
            {recipe.glass && <li>Serve in a {recipe.glass}.</li>}
            {garnishes.map((line) => (
              <li key={line.ingredient}>Garnish: {formatIngredient(line, options)}.</li>
            ))}
            {recipe.type === "coffee" && <li>Serve right away, while it&apos;s hot.</li>}
          </ul>

          <Button
            variant="outline"
            size="lg"
            className="mt-8"
            aria-pressed={favorite}
            onClick={() => setFavorite(!favorite)}
          >
            <HeartIcon data-icon="inline-start" className={cn(favorite && "fill-current")} />
            {favorite ? "Favorited" : "Favorite"}
          </Button>

          <label className="mt-6 block">
            <span className="text-sm font-medium">Your notes</span>
            <Textarea
              className="mt-2 min-h-28"
              placeholder="What would you change next time?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
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
