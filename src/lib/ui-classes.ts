import { cn } from "@/lib/utils";

/** Annual savings / “2 months free” badges — readable in light and dark mode. */
export const promoBadgeClassName = cn(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
  "border-violet-200 bg-violet-100 text-violet-700",
  "dark:border-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
);

/** Strikethrough compare-at annual price (monthly × 12). */
export const compareAtPriceClassName = cn(
  "mr-2 text-base font-normal line-through text-zinc-400 dark:text-zinc-500",
);

/** Subtle annual billing disclaimer under the interval toggle. */
export const annualDisclaimerClassName =
  "max-w-sm text-center text-xs leading-relaxed text-muted";
