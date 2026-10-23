import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ModeSwitch } from "@/components/ui/mode-switch";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Mugshot home" className="rounded-control">
          <Logo />
        </Link>
        <ModeSwitch />
      </div>
    </header>
  );
}
