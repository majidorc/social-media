import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({ title, description, children, className, actions }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 sm:p-5 dark:shadow-black/20",
        className,
      )}
    >
      {(title || description || actions) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  );
}

interface FileDropzoneProps {
  label: string;
  labelIcon?: ReactNode;
  hint?: string;
  accept?: string;
  urlValue: string;
  onUrlChange: (value: string) => void;
  onFileSelect?: (file: File | null) => void;
  fileName?: string | null;
}

export function FileDropzone({
  label,
  labelIcon,
  hint,
  accept,
  urlValue,
  onUrlChange,
  onFileSelect,
  fileName,
}: FileDropzoneProps) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        {labelIcon ? (
          <span className="inline-flex text-accent-text">{labelIcon}</span>
        ) : null}
        {label}
      </p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card-muted px-4 py-6 text-center transition-colors hover:border-violet-500/50 hover:bg-card sm:py-8">
        <Upload className="mb-3 h-8 w-8 text-muted" />
        <span className="text-sm font-medium text-foreground">
          Drop a file here or click to browse
        </span>
        <span className="mt-1 text-xs text-muted">
          {fileName ?? "Optional — upload or paste a URL below"}
        </span>
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => onFileSelect?.(event.target.files?.[0] ?? null)}
        />
      </label>
      <input
        type="url"
        value={urlValue}
        onChange={(event) => onUrlChange(event.target.value)}
        placeholder="Or paste a URL (https://...)"
        className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
      />
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
