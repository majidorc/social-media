import { cn } from "@/lib/utils";
import type { ReactNode, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelIcon?: ReactNode;
  hint?: string;
}

export function Textarea({
  className,
  label,
  labelIcon,
  hint,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      {label ? (
        <label
          htmlFor={textareaId}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          {labelIcon ? (
            <span className="inline-flex text-accent-text">{labelIcon}</span>
          ) : null}
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={cn(
          "min-h-28 w-full resize-y rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 sm:min-h-32",
          className,
        )}
        {...props}
      />
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
