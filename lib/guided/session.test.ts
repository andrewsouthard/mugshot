import { describe, expect, it } from "vitest";
import { loadRecipeBundle } from "../content/load";
import {
  countdownsToAlert,
  displaySeconds,
  newSession,
  pauseTimer,
  resumableSession,
  SESSION_MAX_AGE_MS,
  startTimer,
} from "./session";

const { recipes } = loadRecipeBundle();
const sidecar = recipes.find((recipe) => recipe.id === "sidecar")!;
const shake = sidecar.steps[3].timer!;

describe("timers", () => {
  it("measures from the start time, not ticks", () => {
    const running = startTimer(undefined, 1_000);
    expect(displaySeconds(shake, running, 1_000)).toBe(12);
    expect(displaySeconds(shake, running, 1_001)).toBe(12);
    expect(displaySeconds(shake, running, 6_000)).toBe(7);
    // The phone slept through the end.
    expect(displaySeconds(shake, running, 60_000)).toBe(0);
  });

  it("banks time across pause and resume", () => {
    const paused = pauseTimer(startTimer(undefined, 0), 4_000);
    expect(displaySeconds(shake, paused, 100_000)).toBe(8);
    const resumed = startTimer(paused, 200_000);
    expect(displaySeconds(shake, resumed, 203_000)).toBe(5);
  });

  it("counts a stopwatch up", () => {
    const stopwatch = { kind: "stopwatch" as const, seconds: 30, autoStart: false };
    expect(displaySeconds(stopwatch, startTimer(undefined, 0), 45_500)).toBe(45);
  });

  it("finds finished countdowns that haven't beeped", () => {
    const session = newSession(sidecar, 1, 0);
    session.timers[3] = startTimer(undefined, 0);
    expect(countdownsToAlert(sidecar, session, 11_999)).toEqual([]);
    expect(countdownsToAlert(sidecar, session, 12_000)).toEqual([3]);
    session.timers[3] = { ...session.timers[3], alerted: true };
    expect(countdownsToAlert(sidecar, session, 20_000)).toEqual([]);
  });
});

describe("resumableSession", () => {
  const saved = { ...newSession(sidecar, 2, 0), phase: "steps" as const, step: 3 };

  it("resumes a recent session", () => {
    expect(resumableSession(saved, sidecar, 60_000)).toBe(saved);
  });

  it("starts over when stale, finished or out of range", () => {
    expect(resumableSession(undefined, sidecar, 0)).toBeNull();
    expect(resumableSession(saved, sidecar, SESSION_MAX_AGE_MS + 1)).toBeNull();
    expect(resumableSession({ ...saved, phase: "done" }, sidecar, 0)).toBeNull();
    expect(resumableSession({ ...saved, step: 99 }, sidecar, 0)).toBeNull();
    expect(resumableSession({ ...saved, recipeId: "other" }, sidecar, 0)).toBeNull();
  });

  it("clamps servings from the URL", () => {
    expect(newSession(sidecar, 0, 0).servings).toBe(1);
    expect(newSession(sidecar, 99, 0).servings).toBe(1);
    expect(newSession(sidecar, 4, 0).servings).toBe(4);
  });
});
