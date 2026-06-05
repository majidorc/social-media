import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, description, children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl shadow-black/20",
        className,
      )}
    >
      {(title || description) && (
        <header className="mb-4 space-y-1">
          {title ? (
            <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-zinc-500">{description}</p>
          ) : null}
        </header>
      )}
      {children}
    </section>
  );
}

interface FileDropzoneProps {
  label: string;
  hint?: string;
  accept?: string;
  urlValue: string;
  onUrlChange: (value: string) => void;
  onFileSelect?: (file: File | null) => void;
  fileName?: string | null;
}

export function FileDropzone({
  label,
  hint,
  accept,
  urlValue,
  onUrlChange,
  onFileSelect,
  fileName,
}: FileDropzoneProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-300">{label}</p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-8 text-center transition-colors hover:border-violet-500/50 hover:bg-zinc-900/80">
        <Upload className="mb-3 h-8 w-8 text-zinc-500" />
        <span className="text-sm font-medium text-zinc-300">
          Drop a file here or click to browse
        </span>
        <span className="mt-1 text-xs text-zinc-500">
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
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
      />
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
