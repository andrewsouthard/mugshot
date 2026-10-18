"use client";

import { useOffline } from "next/offline";

export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      role="status"
      className="sticky top-0 z-50 bg-foreground px-4 py-2 text-center text-sm text-background"
    >
      You&apos;re offline. Pending requests will retry when you reconnect.
    </div>
  );
}
