import type { Plan } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  getSubscriptionPeriodEnd,
  parseCheckoutPlanType,
  resolveInvoiceSubscriptionId,
  resolveStripeCustomerId,
  resolveStripeSubscriptionId,
} from "@/lib/stripe";

interface UpsertUserPlanInput {
  userId: string;
  plan: Plan;
  stripeCustomerId: string | null;
  planExpiresAt: Date | null;
}

export async function upsertUserPlan({
  userId,
  plan,
  stripeCustomerId,
  planExpiresAt,
}: UpsertUserPlanInput) {
  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      stripeCustomerId,
      planExpiresAt,
    },
    update: {
      plan,
      stripeCustomerId,
      planExpiresAt,
    },
  });
}

export function resolvePlanFromPriceId(
  priceId: string | null | undefined,
): Plan | null {
  if (!priceId) {
    return null;
  }

  const proPriceId = process.env.STRIPE_PRICE_ID_PRO?.trim();
  const agencyPriceId = process.env.STRIPE_PRICE_ID_AGENCY?.trim();

  if (proPriceId && priceId === proPriceId) {
    return "PRO";
  }

  if (agencyPriceId && priceId === agencyPriceId) {
    return "AGENCY";
  }

  return null;
}

export function resolvePlanFromSubscription(
  subscription: Stripe.Subscription,
): Plan | null {
  const fromMetadata = parseCheckoutPlanType(subscription.metadata?.planType);
  if (fromMetadata) {
    return fromMetadata;
  }

  const priceId = subscription.items?.data?.[0]?.price?.id;
  return resolvePlanFromPriceId(priceId);
}

async function safeSubscriptionPeriodEnd(
  subscriptionId: string | null,
): Promise<Date | null> {
  if (!subscriptionId) {
    return null;
  }

  try {
    return await getSubscriptionPeriodEnd(subscriptionId);
  } catch (error) {
    console.error(
      "[subscription-sync] Failed to fetch subscription period end:",
      error,
    );
    return null;
  }
}

async function applyCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<{ plan: Plan; userId: string } | null> {
  const userId =
    session.metadata?.userId ?? session.client_reference_id ?? null;

  if (!userId) {
    console.error(
      "[subscription-sync] Checkout session missing user reference:",
      session.id,
    );
    return null;
  }

  if (session.payment_status !== "paid") {
    return null;
  }

  const subscription =
    session.subscription && typeof session.subscription !== "string"
      ? session.subscription
      : null;

  const planType =
    parseCheckoutPlanType(session.metadata?.planType) ??
    (subscription ? resolvePlanFromSubscription(subscription) : null);

  if (!planType) {
    console.error(
      "[subscription-sync] Could not resolve plan for checkout session:",
      session.id,
    );
    return null;
  }

  const stripeCustomerId = resolveStripeCustomerId(session.customer);
  const subscriptionId = resolveStripeSubscriptionId(session.subscription);
  const planExpiresAt = await safeSubscriptionPeriodEnd(subscriptionId);

  await upsertUserPlan({
    userId,
    plan: planType,
    stripeCustomerId,
    planExpiresAt,
  });

  return { plan: planType, userId };
}

export async function syncPlanFromCheckoutSession(
  sessionId: string,
  userId: string,
): Promise<{ plan: Plan }> {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const sessionUserId =
    session.metadata?.userId ?? session.client_reference_id ?? null;

  if (!sessionUserId || sessionUserId !== userId) {
    throw new Error("Checkout session does not belong to this user.");
  }

  const result = await applyCheckoutSession(session);

  if (!result) {
    throw new Error("Could not sync subscription plan from checkout session.");
  }

  return { plan: result.plan };
}

export async function syncPlanFromCheckoutSessionEvent(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (typeof session.subscription === "string") {
    const stripe = getStripeClient();
    const expanded = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["subscription"],
    });
    await applyCheckoutSession(expanded);
    return;
  }

  await applyCheckoutSession(session);
}

export async function syncPlanFromStripeSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const plan =
    resolvePlanFromSubscription(subscription) ??
    parseCheckoutPlanType(subscription.metadata?.planType);

  if (!plan) {
    console.error(
      "[subscription-sync] Could not resolve plan for subscription:",
      subscription.id,
    );
    return;
  }

  const stripeCustomerId = resolveStripeCustomerId(subscription.customer);
  let userId: string | null = subscription.metadata?.userId ?? null;

  if (!userId && stripeCustomerId) {
    const settings = await prisma.userSettings.findFirst({
      where: { stripeCustomerId },
      select: { userId: true },
    });
    userId = settings?.userId ?? null;
  }

  if (!userId) {
    console.error(
      "[subscription-sync] No user found for subscription:",
      subscription.id,
    );
    return;
  }

  const planExpiresAt = await safeSubscriptionPeriodEnd(subscription.id);

  if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired"
  ) {
    await upsertUserPlan({
      userId,
      plan: "FREE",
      stripeCustomerId,
      planExpiresAt: null,
    });
    return;
  }

  await upsertUserPlan({
    userId,
    plan,
    stripeCustomerId,
    planExpiresAt,
  });
}

export async function syncPlanFromInvoice(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = resolveInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncPlanFromStripeSubscription(subscription);
}

export async function syncPlanForUser(
  userId: string,
  email: string | null | undefined,
): Promise<{ plan: Plan }> {
  const stripe = getStripeClient();
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  let customerId = settings?.stripeCustomerId ?? null;

  if (!customerId && email) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    customerId = customers.data[0]?.id ?? null;
  }

  if (!customerId) {
    throw new Error("No Stripe customer found for this account.");
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });

  const subscription = subscriptions.data[0];

  if (!subscription) {
    throw new Error("No active subscription found.");
  }

  await syncPlanFromStripeSubscription(subscription);

  const plan = resolvePlanFromSubscription(subscription);

  if (!plan) {
    throw new Error("Could not determine subscription plan.");
  }

  return { plan };
}
