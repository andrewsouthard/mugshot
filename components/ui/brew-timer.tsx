"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { formatDurationRange } from "@/lib/units";
import { cn } from "@/lib/cn";

type Status = "idle" | "running" | "stopped";

/**
 * Shot / steep / stir timer. Give it a target window and it tells you when
 * you're in it: under → muted, inside → green, over → amber.
 */
export function BrewTimer({
  target,
  label = "Timer",
  className,
}: {
  /** [min, max] seconds */
  target: [number, number];
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (status !== "running") return;
    let frame = requestAnimationFrame(function tick() {
      setElapsed((performance.now() - startedAt.current) / 1000);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [status]);

  const [lo, hi] = target;
  const scaleMax = hi * 1.25;
  const zone = elapsed < lo ? "under" : elapsed <= hi ? "in" : "over";
  const zoneColor = {
    under: "var(--brand)",
    in: "var(--success)",
    over: "var(--warning)",
  }[zone];

  function start() {
    startedAt.current =
      performance.now() - (status === "stopped" ? elapsed * 1000 : 0);
    setStatus("running");
  }

  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        <span className="measure text-xs text-ink-faint">
          target {formatDurationRange(target)}
        </span>
      </div>

      <div
        className="measure mt-2 text-5xl font-medium tabular-nums transition-colors"
        style={{ color: zone === "under" ? "var(--ink)" : zoneColor }}
        role="timer"
        aria-live="off"
      >
        {hi < 60 ? (
          <>
            {elapsed.toFixed(1)}
            <span className="ml-1 text-xl text-ink-muted">s</span>
          </>
        ) : (
          `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, "0")}`
        )}
      </div>

      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-sunken">
        <div
          className="absolute inset-y-0 bg-success/30"
          style={{
            left: `${(lo / scaleMax) * 100}%`,
            width: `${((hi - lo) / scaleMax) * 100}%`,
          }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${Math.min(1, elapsed / scaleMax) * 100}%`,
            background: zoneColor,
          }}
        />
      </div>

      <div className="mt-5 flex gap-2">
        {status === "running" ? (
          <Button size="lg" onClick={() => setStatus("stopped")}>
            Stop
          </Button>
        ) : (
          <Button size="lg" onClick={start}>
            {status === "stopped" ? "Resume" : "Start"}
          </Button>
        )}
        <Button
          variant="ghost"
          disabled={status === "idle"}
          onClick={() => {
            setStatus("idle");
            setElapsed(0);
          }}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
