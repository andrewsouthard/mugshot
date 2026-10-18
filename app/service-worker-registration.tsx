"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Registers the service worker and shows an "update available" prompt when a
 * new version has been downloaded and is waiting.
 */
export function ServiceWorkerRegistration() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Skipped in dev so a cached worker can't interfere with HMR.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const sw = navigator.serviceWorker;
    // Only an update has an existing controller; a first install doesn't.
    const offer = (worker: ServiceWorker | null) => {
      if (worker && sw.controller) setWaiting(worker);
    };

    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => {
      if (document.visibilityState === "visible") void registration?.update().catch(() => {});
    };

    sw.register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        offer(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          installing?.addEventListener("statechange", () => {
            if (installing.state === "installed") offer(installing);
          });
        });
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });

    // An installed app can stay open for days; look for updates when it
    // comes back to the foreground.
    document.addEventListener("visibilitychange", checkForUpdate);
    return () => document.removeEventListener("visibilitychange", checkForUpdate);
  }, []);

  const update = () => {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
      once: true,
    });
    waiting.postMessage("SKIP_WAITING");
  };

  // Guided mode is full screen; the prompt waits until you're done.
  if (!waiting || dismissed || pathname.endsWith("/make")) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-popover p-3 pl-4 text-sm text-popover-foreground shadow-lg"
    >
      <p className="flex-1">An update is available.</p>
      <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
        Later
      </Button>
      <Button size="sm" onClick={update}>
        Update
      </Button>
    </div>
  );
}
