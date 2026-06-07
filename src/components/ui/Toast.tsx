"use client";

import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  variant?: "success" | "error";
  durationMs?: number;
}

export function Toast({
  message,
  onDismiss,
  variant = "success",
  durationMs = 3200,
}: ToastProps) {
  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, message, onDismiss]);

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm",
        variant === "success"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200"
          : "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300",
      )}
    >
      {message}
    </div>
  );
}
