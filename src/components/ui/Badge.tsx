import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-card-muted text-foreground",
        variant === "success" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        variant === "warning" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
        className,
      )}
    >
      {children}
    </span>
  );
}
