"use client";

import { cn } from "@/lib/utils";
import { Alert, type AlertVariant } from "@/components/ui/Alert";
import { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  variant?: "success" | "error";
  durationMs?: number;
}

const toastVariantMap: Record<NonNullable<ToastProps["variant"]>, AlertVariant> =
  {
    success: "success",
    error: "error",
  };

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
    <Alert
      role="status"
      aria-live="polite"
      variant={toastVariantMap[variant]}
      className={cn(
        "fixed bottom-4 right-4 z-[100] max-w-sm shadow-lg backdrop-blur-sm",
      )}
    >
      {message}
    </Alert>
  );
}
