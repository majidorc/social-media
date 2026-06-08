import type {
  CheckoutSessionResponse,
  CheckoutPlanType,
  MarketingBillingInterval,
} from "@/types";

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface CheckoutResult {
  redirected: boolean;
  updated: boolean;
  message?: string;
}

function buildLoginRedirectUrl(): string {
  const callbackUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ callbackUrl });
  return `/login?${params.toString()}`;
}

export async function startCheckout(
  planType: CheckoutPlanType,
  billingInterval: MarketingBillingInterval = "MONTHLY",
): Promise<CheckoutResult> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ planType, billingInterval }),
  });

  if (response.status === 401) {
    window.location.href = buildLoginRedirectUrl();
    return { redirected: true, updated: false };
  }

  const data = (await response.json()) as CheckoutSessionResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new CheckoutError(data.error ?? "Failed to start checkout.", response.status);
  }

  if (data.updated) {
    return {
      redirected: false,
      updated: true,
      message: data.message,
    };
  }

  if (!data.url) {
    throw new CheckoutError("Failed to start checkout.", response.status);
  }

  window.location.href = data.url;
  return { redirected: true, updated: false };
}
