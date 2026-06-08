import { cn } from "@/lib/utils";

const landingCtaBaseClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-8 text-sm font-semibold transition-all";

const landingCtaLightClassName =
  "bg-violet-600 text-white hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25";

const landingCtaDarkPrimaryClassName =
  "dark:bg-gradient-to-r dark:from-violet-600 dark:to-violet-500 dark:text-white dark:hover:from-violet-500 dark:hover:to-violet-400 dark:shadow-lg dark:shadow-violet-500/20 dark:hover:shadow-violet-500/30";

const landingCtaDarkSignInClassName =
  "dark:border dark:border-border dark:bg-transparent dark:text-foreground dark:shadow-none dark:hover:bg-card-muted dark:hover:shadow-none";

/** Primary landing CTAs — hero + navbar “Get started” */
export const landingPrimaryCtaClassName = cn(
  landingCtaBaseClassName,
  landingCtaLightClassName,
  landingCtaDarkPrimaryClassName,
);

/** Navbar sign-in — matches hero in light mode, outline in dark mode */
export const landingNavSignInClassName = cn(
  landingCtaBaseClassName,
  landingCtaLightClassName,
  landingCtaDarkSignInClassName,
);

/** Full-width hero Google sign-in button */
export const landingHeroCtaClassName = cn(
  landingPrimaryCtaClassName,
  "w-full gap-3 border-0",
);
