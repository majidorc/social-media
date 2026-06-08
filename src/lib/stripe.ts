import Stripe from "stripe";
import type { CheckoutPlanType } from "@/types";

export type { CheckoutPlanType };

const CHECKOUT_PLAN_TYPES: CheckoutPlanType[] = ["PRO", "AGENCY"];

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      typescript: true,
    });
  }

  return stripeClient;
}

export function isCheckoutPlanType(value: string): value is CheckoutPlanType {
  return CHECKOUT_PLAN_TYPES.includes(value as CheckoutPlanType);
}

export function parseCheckoutPlanType(
  value: string | null | undefined,
): CheckoutPlanType | null {
  if (!value || !isCheckoutPlanType(value)) {
    return null;
  }

  return value;
}

export function getStripePriceId(planType: CheckoutPlanType): string {
  const envKey =
    planType === "PRO" ? "STRIPE_PRICE_ID_PRO" : "STRIPE_PRICE_ID_AGENCY";
  const priceId = process.env[envKey]?.trim();

  if (!priceId) {
    throw new Error(`${envKey} is not configured.`);
  }

  return priceId;
}

export function resolveAppBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function resolveStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) {
    return null;
  }

  if (typeof customer === "string") {
    return customer;
  }

  if ("deleted" in customer && customer.deleted) {
    return null;
  }

  return customer.id;
}

export function resolveStripeSubscriptionId(
  subscription: string | Stripe.Subscription | null,
): string | null {
  if (!subscription) {
    return null;
  }

  return typeof subscription === "string" ? subscription : subscription.id;
}

export function resolveInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;

  if (parentSubscription) {
    return resolveStripeSubscriptionId(parentSubscription);
  }

  const legacySubscription = (
    invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
  ).subscription;

  return resolveStripeSubscriptionId(legacySubscription ?? null);
}

export async function getSubscriptionPeriodEnd(
  subscriptionId: string,
): Promise<Date | null> {
  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data"],
  });

  const items = subscription.items?.data ?? [];

  if (items.length === 0) {
    return null;
  }

  const periodEnd = Math.max(...items.map((item) => item.current_period_end));

  if (!Number.isFinite(periodEnd)) {
    return null;
  }

  return new Date(periodEnd * 1000);
}
