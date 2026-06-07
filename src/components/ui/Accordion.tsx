"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface AccordionProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  title: string;
  collapsedTitle?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

interface AccordionCollapsedBarProps {
  onExpand: () => void;
  collapsedTitle?: string;
  hint?: string;
  className?: string;
}

export function AccordionCollapsedBar({
  onExpand,
  collapsedTitle = "Show/Edit Inputs",
  hint = "Tap to adjust your prompt, platforms, or models",
  className,
}: AccordionCollapsedBarProps) {
  return (
    <button
      type="button"
      aria-expanded={false}
      onClick={onExpand}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-violet-500/25 bg-card px-4 py-3.5 text-left shadow-sm shadow-black/5 transition-colors hover:border-violet-500/40 hover:bg-card-muted sm:px-5",
        "dark:shadow-black/20",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground sm:text-base">
          {collapsedTitle}
        </span>
        <span className="mt-0.5 block text-xs text-muted sm:text-sm">{hint}</span>
      </span>
      <ChevronDown className="h-5 w-5 shrink-0 text-accent-text" aria-hidden />
    </button>
  );
}

export function Accordion({
  expanded,
  onExpandedChange,
  title,
  collapsedTitle = "Show/Edit Inputs",
  description,
  children,
  className,
}: AccordionProps) {
  const headerLabel = expanded ? title : collapsedTitle;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/5 dark:shadow-black/20",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-card-muted sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-foreground">
            {headerLabel}
          </span>
          {description && expanded ? (
            <span className="mt-1 block text-sm text-muted">{description}</span>
          ) : null}
          {!expanded ? (
            <span className="mt-1 block text-sm text-muted">
              Tap to adjust your prompt, platforms, or models
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted transition-transform duration-300",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-border px-4 pb-4 pt-4 sm:space-y-6 sm:px-5 sm:pb-5 sm:pt-5">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
