"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card-muted text-foreground transition-colors hover:bg-card hover:text-foreground",
        compact ? "h-9 w-9 shrink-0" : "w-full px-3 py-2.5 text-sm font-medium",
        className,
      )}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 shrink-0 text-amber-400" />
          {compact ? null : "Light mode"}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 shrink-0 text-violet-500" />
          {compact ? null : "Dark mode"}
        </>
      )}
    </button>
  );
}
