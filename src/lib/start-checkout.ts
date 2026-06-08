import type { CheckoutSessionResponse, CheckoutPlanType } from "@/types";

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

function buildLoginRedirectUrl(): string {
  const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ callbackUrl });
  return `/login?${params.toString()}`;
}

export async function startCheckout(planType: CheckoutPlanType): Promise<void> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ planType }),
  });

  if (response.status === 401) {
    window.location.href = buildLoginRedirectUrl();
    return;
  }

  const data = (await response.json()) as CheckoutSessionResponse & {
    error?: string;
  };

  if (!response.ok || !data.url) {
    throw new CheckoutError(data.error ?? "Failed to start checkout.", response.status);
  }

  window.location.href = data.url;
}
