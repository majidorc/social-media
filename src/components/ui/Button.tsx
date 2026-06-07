import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary:
    "bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-500/50",
  secondary:
    "border border-border bg-card-muted text-foreground hover:bg-card focus-visible:ring-zinc-500/50",
  ghost:
    "bg-transparent text-muted hover:bg-card-muted hover:text-foreground focus-visible:ring-zinc-500/50",
  danger:
    "bg-red-600/90 text-white hover:bg-red-500 focus-visible:ring-red-500/50",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
