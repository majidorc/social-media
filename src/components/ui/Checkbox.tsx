import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

export function Checkbox({
  className,
  label,
  description,
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      htmlFor={checkboxId}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card-muted p-4 transition-colors hover:border-violet-500/30 hover:bg-card",
        props.checked &&
          "border-violet-500/40 bg-accent-soft ring-1 ring-violet-500/20 hover:bg-accent-soft",
        className,
      )}
    >
      <span
        className={cn(
          "relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-input transition-colors",
          "group-has-[:checked]:border-violet-600 group-has-[:checked]:bg-violet-600 dark:group-has-[:checked]:border-violet-500",
        )}
      >
        <Check className="h-3.5 w-3.5 text-white opacity-0 group-has-[:checked]:opacity-100" />
      </span>
      <input
        id={checkboxId}
        type="checkbox"
        className="sr-only"
        {...props}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
