import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelIcon?: ReactNode;
  hint?: string;
}

export function Input({
  className,
  label,
  labelIcon,
  hint,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          {labelIcon ? (
            <span className="inline-flex text-accent-text">{labelIcon}</span>
          ) : null}
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
          className,
        )}
        {...props}
      />
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
