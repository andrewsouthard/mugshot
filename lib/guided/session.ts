import type { ResolvedRecipe, Timer } from "../content/schema";

/**
 * A timer's state. Time is measured from `startedAt` rather than counted in
 * ticks, so it stays right while the phone sleeps or the app is in the
 * background.
 */
export type TimerState = {
  /** Epoch ms when it was last started, or null while paused. */
  startedAt: number | null;
  /** Time banked before the last start. */
  elapsedMs: number;
  /** Set once a finished countdown has beeped. */
  alerted: boolean;
};

export type Phase = "prep" | "steps" | "done";

/** A guided session in progress, saved on the device. */
export type Session = {
  recipeId: string;
  servings: number;
  phase: Phase;
  /** Index into the recipe's steps. */
  step: number;
  /** Ticked prep checklist items. */
  checked: string[];
  /** Keyed by step index. */
  timers: Record<number, TimerState>;
  updatedAt: number;
};

/** Saved sessions older than this start fresh instead of resuming. */
export const SESSION_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export const MAX_SERVINGS = 12;

export function newSession(recipe: ResolvedRecipe, servings: number, now: number): Session {
  return {
    recipeId: recipe.id,
    servings: clampServings(servings, recipe.serves),
    phase: "prep",
    step: 0,
    checked: [],
    timers: {},
    updatedAt: now,
  };
}

function clampServings(servings: number, fallback: number): number {
  return Number.isInteger(servings) && servings >= 1 && servings <= MAX_SERVINGS
    ? servings
    : fallback;
}

/** A saved session worth resuming, or null to start over. */
export function resumableSession(
  saved: Session | undefined,
  recipe: ResolvedRecipe,
  now: number,
): Session | null {
  if (!saved || saved.recipeId !== recipe.id || saved.phase === "done") return null;
  if (now - saved.updatedAt > SESSION_MAX_AGE_MS) return null;
  if (saved.step < 0 || saved.step >= recipe.steps.length) return null;
  if (clampServings(saved.servings, -1) === -1) return null;
  return saved;
}

export function elapsedMs(state: TimerState | undefined, now: number): number {
  if (!state) return 0;
  return state.elapsedMs + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}

export function startTimer(state: TimerState | undefined, now: number): TimerState {
  return { startedAt: now, elapsedMs: state?.elapsedMs ?? 0, alerted: state?.alerted ?? false };
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  return { startedAt: null, elapsedMs: elapsedMs(state, now), alerted: state.alerted };
}

export function isRunning(state: TimerState | undefined): boolean {
  return state?.startedAt != null;
}

/** Seconds to show: remaining for a countdown (never below 0), elapsed for a stopwatch. */
export function displaySeconds(timer: Timer, state: TimerState | undefined, now: number): number {
  const elapsed = elapsedMs(state, now) / 1000;
  return timer.kind === "countdown"
    ? Math.max(0, Math.ceil(timer.seconds - elapsed))
    : Math.floor(elapsed);
}

export function isFinished(timer: Timer, state: TimerState | undefined, now: number): boolean {
  return timer.kind === "countdown" && elapsedMs(state, now) >= timer.seconds * 1000;
}

/** Steps whose running countdown has run out but hasn't beeped yet. */
export function countdownsToAlert(
  recipe: ResolvedRecipe,
  session: Session,
  now: number,
): number[] {
  return recipe.steps.flatMap(({ timer }, index) => {
    const state = session.timers[index];
    return timer && isRunning(state) && !state.alerted && isFinished(timer, state, now)
      ? [index]
      : [];
  });
}
