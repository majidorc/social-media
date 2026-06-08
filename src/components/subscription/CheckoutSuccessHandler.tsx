"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function CheckoutSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncedSessionRef = useRef<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");

    if (checkout !== "success" || !sessionId) {
      return;
    }

    if (syncedSessionRef.current === sessionId) {
      return;
    }

    syncedSessionRef.current = sessionId;

    void (async () => {
      try {
        const response = await fetch("/api/checkout/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = (await response.json()) as {
          error?: string;
          plan?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to activate subscription.");
        }

        setMessage(
          data.plan ? `Your ${data.plan} plan is now active.` : "Subscription activated.",
        );
        router.refresh();
        router.replace("/dashboard");
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Payment succeeded, but plan sync is still pending.",
        );
      }
    })();
  }, [router, searchParams]);

  if (!message) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
      {message}
    </div>
  );
}
