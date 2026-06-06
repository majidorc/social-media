"use client";

import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  truncateLabel,
} from "@/lib/format-relative-time";
import { GENERATION_HISTORY_UPDATED_EVENT } from "@/lib/generation-history-events";
import type { GenerationHistoryResponse, WorkspaceHistoryItem } from "@/types";
import { Clock3, History, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function HistoryPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWorkspaceId = searchParams.get("workspace");

  const [history, setHistory] = useState<WorkspaceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch("/api/generate", { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Failed to load history.");
      }

      const data = (await response.json()) as GenerationHistoryResponse;
      setHistory(data.history);
    } catch {
      setError("Could not load history.");
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    const handleUpdate = () => {
      void loadHistory();
    };

    window.addEventListener(GENERATION_HISTORY_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(GENERATION_HISTORY_UPDATED_EVENT, handleUpdate);
    };
  }, [loadHistory]);

  const handleSelect = (workspaceId: string) => {
    if (pathname.startsWith("/dashboard")) {
      router.push(`/dashboard?workspace=${workspaceId}`);
      return;
    }

    router.push(`/dashboard?workspace=${workspaceId}`);
  };

  return (
    <section className="border-t border-zinc-800 px-3 py-4">
      <div className="mb-3 flex items-center gap-2 px-1">
        <History className="h-4 w-4 text-violet-400" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          History
        </h2>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl bg-zinc-900/60 px-3 py-4 text-xs text-zinc-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
          Loading recent generations...
        </div>
      ) : error ? (
        <p className="rounded-xl bg-zinc-900/60 px-3 py-3 text-xs text-red-300">
          {error}
        </p>
      ) : history.length === 0 ? (
        <p className="rounded-xl bg-zinc-900/60 px-3 py-3 text-xs leading-relaxed text-zinc-500">
          Generated content will appear here for quick recall.
        </p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {history.map((item) => {
            const isActive =
              pathname.startsWith("/dashboard") && activeWorkspaceId === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-violet-600/15 ring-1 ring-violet-500/30"
                      : "hover:bg-zinc-900",
                  )}
                >
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      isActive ? "text-violet-200" : "text-zinc-200",
                    )}
                  >
                    {truncateLabel(item.idea)}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Clock3 className="h-3 w-3 shrink-0" />
                    <span>{formatRelativeTime(item.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.platforms.length} platforms</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
