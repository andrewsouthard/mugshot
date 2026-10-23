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
      className="sticky top-0 z-50 border-b border-line bg-brand-wash px-4 py-2 text-center text-sm text-ink"
    >
      You&apos;re offline. Saved recipes are ready to make.
    </div>
  );
}
