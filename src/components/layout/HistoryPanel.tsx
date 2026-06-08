"use client";

import { cn } from "@/lib/utils";
import { Alert } from "@/components/ui/Alert";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  resolveHistoryItemTitle,
  truncateHistoryTitle,
} from "@/lib/history-display";
import {
  GENERATION_HISTORY_UPDATED_EVENT,
  notifyGenerationHistoryDeleted,
} from "@/lib/generation-history-events";
import type {
  ClearHistoryResponse,
  DeleteWorkspaceResponse,
  GenerationHistoryResponse,
  HistoryMutationErrorResponse,
  WorkspaceHistoryItem,
} from "@/types";
import { Clock3, History, Loader2, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface HistoryToast {
  message: string;
  tone: "success" | "error";
}

interface HistoryPanelProps {
  onNavigate?: () => void;
}

export function HistoryPanel({ onNavigate }: HistoryPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWorkspaceId = searchParams.get("workspace");

  const [history, setHistory] = useState<WorkspaceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [toast, setToast] = useState<HistoryToast | null>(null);

  const showToast = useCallback((message: string, tone: HistoryToast["tone"]) => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

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
    router.push(`/dashboard?workspace=${workspaceId}`);
    onNavigate?.();
  };

  const handleDeleteItem = async (
    event: React.MouseEvent<HTMLButtonElement>,
    workspaceId: string,
  ) => {
    event.stopPropagation();

    const item = history.find((entry) => entry.id === workspaceId);
    const label = truncateHistoryTitle(
      item?.displayTitle ??
        resolveHistoryItemTitle(item?.idea),
      48,
    );

    const confirmed = window.confirm(
      `Delete "${label}" permanently? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(workspaceId);
    setError(null);

    try {
      const response = await fetch(`/api/generate/${workspaceId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await response.json()) as
        | DeleteWorkspaceResponse
        | HistoryMutationErrorResponse;

      if (!response.ok || !("success" in data)) {
        throw new Error(
          "error" in data ? data.error : "Failed to delete generation.",
        );
      }

      setHistory((current) => current.filter((item) => item.id !== workspaceId));
      notifyGenerationHistoryDeleted({ workspaceId });
      showToast("Generation deleted.", "success");
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete generation.",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (history.length === 0 || isClearingAll) {
      return;
    }

    const confirmed = window.confirm(
      `Delete all ${history.length} saved generations permanently? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setIsClearingAll(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await response.json()) as
        | ClearHistoryResponse
        | HistoryMutationErrorResponse;

      if (!response.ok || !("success" in data)) {
        throw new Error(
          "error" in data ? data.error : "Failed to clear history.",
        );
      }

      setHistory([]);
      notifyGenerationHistoryDeleted({ clearedAll: true });
      showToast(
        data.deletedCount === 1
          ? "1 generation deleted."
          : `${data.deletedCount} generations deleted.`,
        "success",
      );
    } catch (clearError) {
      showToast(
        clearError instanceof Error
          ? clearError.message
          : "Failed to clear history.",
        "error",
      );
    } finally {
      setIsClearingAll(false);
    }
  };

  const isMutating = deletingId !== null || isClearingAll;

  return (
    <section className="min-w-0 border-t border-border px-3 py-3 sm:py-4">
      <div className="mb-3 flex items-center gap-2 px-1">
        <History className="h-4 w-4 text-accent-text" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          History
        </h2>
        {!isLoading && history.length > 0 ? (
          <button
            type="button"
            onClick={() => void handleClearAll()}
            disabled={isMutating}
            className="ml-auto text-[11px] text-muted transition-colors hover:text-red-500 dark:hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClearingAll ? "Clearing..." : "Clear all"}
          </button>
        ) : null}
      </div>

      {toast ? (
        <Alert
          variant={toast.tone === "success" ? "success" : "error"}
          className="mb-3 rounded-lg px-3 py-2 text-[11px]"
        >
          {toast.message}
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-xl bg-card-muted px-3 py-4 text-xs text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-text" />
          Loading recent generations...
        </div>
      ) : error ? (
        <p className="rounded-xl bg-card-muted px-3 py-3 text-xs text-red-500 dark:text-red-300">
          {error}
        </p>
      ) : history.length === 0 ? (
        <p className="rounded-xl bg-card-muted px-3 py-3 text-xs leading-relaxed text-muted">
          No history found. Generated content will appear here for quick recall.
        </p>
      ) : (
        <ul className="max-h-40 space-y-1 overflow-y-auto pr-1 sm:max-h-56">
          {history.map((item) => {
            const isActive =
              pathname.startsWith("/dashboard") && activeWorkspaceId === item.id;
            const isDeleting = deletingId === item.id;
            const title = item.displayTitle;
            const timestamp = formatRelativeTime(item.createdAt);

            return (
              <li key={item.id}>
                <div
                  className={cn(
                    "group flex items-stretch rounded-xl transition-colors",
                    isActive
                      ? "bg-accent-soft ring-1 ring-violet-500/30"
                      : "hover:bg-card-muted",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    disabled={isMutating}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className={cn(
                        "block max-w-[180px] truncate text-sm font-medium leading-snug",
                        isActive ? "text-accent-text" : "text-foreground",
                      )}
                      title={title}
                    >
                      {title}
                    </span>
                    <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                      <Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{timestamp}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">
                        {item.platforms.length}{" "}
                        {item.platforms.length === 1 ? "platform" : "platforms"}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${truncateHistoryTitle(title, 32)}`}
                    onClick={(event) => void handleDeleteItem(event, item.id)}
                    disabled={isMutating}
                    className={cn(
                      "mr-2 inline-flex items-center self-center rounded-lg p-1.5 text-muted transition-all",
                      "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
                      "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                    )}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
