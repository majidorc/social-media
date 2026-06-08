import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type AlertVariant = "warning" | "error" | "success" | "info";

const variantStyles: Record<AlertVariant, string> = {
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  error: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  info: "border-emerald-500/20 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200/90",
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: AlertVariant;
}

export function Alert({
  children,
  variant = "error",
  className,
  role = "alert",
  ...props
}: AlertProps) {
  return (
    <div
      role={role}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Inline code snippets inside warning alerts (env var names, etc.). */
export function AlertCode({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "rounded bg-amber-500/20 px-1 font-mono text-[0.85em] text-amber-900 dark:bg-amber-500/25 dark:text-amber-100",
        className,
      )}
    >
      {children}
    </code>
  );
}
