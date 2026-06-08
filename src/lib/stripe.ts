import Stripe from "stripe";
import type { BillingInterval } from "@prisma/client";
import type { CheckoutPlanType } from "@/types";

export type { CheckoutPlanType };

const CHECKOUT_PLAN_TYPES: CheckoutPlanType[] = ["PRO", "AGENCY"];
const BILLING_INTERVALS: BillingInterval[] = ["MONTHLY", "ANNUAL"];

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

export function isBillingInterval(value: string): value is BillingInterval {
  return BILLING_INTERVALS.includes(value as BillingInterval);
}

export function parseBillingInterval(
  value: string | null | undefined,
): BillingInterval | null {
  if (!value || !isBillingInterval(value)) {
    return null;
  }

  return value;
}

export function getStripePriceId(
  planType: CheckoutPlanType,
  billingInterval: BillingInterval = "MONTHLY",
): string {
  const envKey =
    billingInterval === "ANNUAL"
      ? planType === "PRO"
        ? "STRIPE_PRICE_ID_PRO_ANNUAL"
        : "STRIPE_PRICE_ID_AGENCY_ANNUAL"
      : planType === "PRO"
        ? "STRIPE_PRICE_ID_PRO"
        : "STRIPE_PRICE_ID_AGENCY";
  const priceId = process.env[envKey]?.trim();

  if (!priceId) {
    throw new Error(`${envKey} is not configured.`);
  }

  return priceId;
}

/** @deprecated Use getStripePriceId(planType, interval) */
export function getStripePriceIdLegacy(planType: CheckoutPlanType): string {
  return getStripePriceId(planType, "MONTHLY");
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

export function resolveSubscriptionActivationUnix(
  subscription: Stripe.Subscription,
): number {
  const items = subscription.items?.data ?? [];
  const periodStart = items.length
    ? Math.min(...items.map((item) => item.current_period_start))
    : subscription.start_date;

  return Number.isFinite(periodStart) ? periodStart : subscription.start_date;
}

export function inferBillingIntervalFromSubscription(
  subscription: Stripe.Subscription,
): BillingInterval {
  const fromMetadata = parseBillingInterval(subscription.metadata?.billingInterval);
  if (fromMetadata) {
    return fromMetadata;
  }

  const price = subscription.items?.data?.[0]?.price;
  if (price?.recurring?.interval === "year") {
    return "ANNUAL";
  }

  return "MONTHLY";
}

export interface InvoiceRefundTarget {
  invoiceId: string;
  amountPaidCents: number;
  chargeId: string | null;
  paymentIntentId: string | null;
}

type InvoiceWithLegacyPaymentFields = Stripe.Invoice & {
  payment_intent?: string | Stripe.PaymentIntent | null;
  charge?: string | Stripe.Charge | null;
};

function resolveId(
  value: string | Stripe.PaymentIntent | Stripe.Charge | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

export async function resolveSubscriptionPaidInvoice(
  subscription: Stripe.Subscription,
): Promise<InvoiceRefundTarget | null> {
  const stripe = getStripeClient();

  const invoices = await stripe.invoices.list({
    subscription: subscription.id,
    status: "paid",
    limit: 1,
  });

  let invoiceId = invoices.data[0]?.id ?? null;

  if (!invoiceId && subscription.latest_invoice) {
    const latest = subscription.latest_invoice;
    invoiceId = typeof latest === "string" ? latest : latest.id;
  }

  if (!invoiceId) {
    return null;
  }

  const invoice = (await stripe.invoices.retrieve(invoiceId, {
    expand: ["payment_intent", "charge"],
  })) as InvoiceWithLegacyPaymentFields;

  if (invoice.status !== "paid" || invoice.amount_paid <= 0) {
    return null;
  }

  const paymentIntentId = resolveId(invoice.payment_intent);
  let chargeId = resolveId(invoice.charge);

  if (!chargeId && paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    chargeId = resolveId(paymentIntent.latest_charge);
  }

  return {
    invoiceId,
    amountPaidCents: invoice.amount_paid,
    chargeId,
    paymentIntentId,
  };
}

export async function executeStripeRefund(
  target: InvoiceRefundTarget,
  amountCents: number,
): Promise<Stripe.Refund> {
  if (amountCents <= 0) {
    throw new Error("Refund amount must be greater than zero.");
  }

  const stripe = getStripeClient();
  const refundParams = {
    amount: amountCents,
    reason: "requested_by_customer" as const,
  };

  if (target.paymentIntentId) {
    return stripe.refunds.create({
      ...refundParams,
      payment_intent: target.paymentIntentId,
    });
  }

  if (target.chargeId) {
    return stripe.refunds.create({
      ...refundParams,
      charge: target.chargeId,
    });
  }

  throw new Error(
    "Could not locate a refundable payment for this subscription. Contact support if you need a refund.",
  );
}
