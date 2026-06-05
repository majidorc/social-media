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
        "group flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900/70",
        props.checked && "border-violet-500/50 bg-violet-500/5",
        className,
      )}
    >
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-zinc-600 bg-zinc-950 group-has-[:checked]:border-violet-500 group-has-[:checked]:bg-violet-600">
        <Check className="h-3.5 w-3.5 text-white opacity-0 group-has-[:checked]:opacity-100" />
      </span>
      <input
        id={checkboxId}
        type="checkbox"
        className="sr-only"
        {...props}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-zinc-100">{label}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
