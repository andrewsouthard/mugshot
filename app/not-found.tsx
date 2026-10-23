import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { MugMark } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <MugMark className="mb-6 size-16" />
        <p className="eyebrow">404 · A missing recipe</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Nothing in this glass.
        </h1>
        <p className="mt-4 text-lg text-ink-muted">
          We couldn’t find that page. Let’s find you something good to make.
        </p>
        <Button
          size="lg"
          className="mt-8"
          nativeButton={false}
          render={<Link href="/" />}
        >
          All recipes
        </Button>
      </main>
    </>
  );
}
