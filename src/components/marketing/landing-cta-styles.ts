import { cn } from "@/lib/utils";

const landingCtaBaseClassName =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-8 text-sm font-semibold transition-all";

const landingCtaLightClassName =
  "bg-violet-600 text-white hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25";

const landingCtaDarkPrimaryClassName =
  "dark:bg-gradient-to-r dark:from-violet-600 dark:to-violet-500 dark:text-white dark:hover:from-violet-500 dark:hover:to-violet-400 dark:shadow-lg dark:shadow-violet-500/20 dark:hover:shadow-violet-500/30";

/** Unified landing “Get Started” CTA */
export const landingPrimaryCtaClassName = cn(
  landingCtaBaseClassName,
  landingCtaLightClassName,
  landingCtaDarkPrimaryClassName,
);
