"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { MugMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  useEffect(() => {
    const retry = () => window.location.reload();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, []);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <MugMark className="mb-6 size-16" />
        <p className="eyebrow">A little pause</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          You’re offline
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          This page isn’t saved on your device. Your saved recipes are still
          ready to make.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/" />}>
            All recipes
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      </main>
    </>
  );
}
