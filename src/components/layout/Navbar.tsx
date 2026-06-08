import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  landingNavSignInClassName,
  landingPrimaryCtaClassName,
} from "@/components/marketing/landing-cta-styles";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{APP_NAME}</p>
            <p className="text-xs text-muted">AI social content studio</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className={cn(landingNavSignInClassName, "hidden sm:inline-flex")}
          >
            Sign in
          </Link>
          <Link href="/login" className={landingPrimaryCtaClassName}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
