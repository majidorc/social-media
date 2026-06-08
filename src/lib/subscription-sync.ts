import type { BillingInterval, Plan } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  calculateDaysUsedSinceActivation,
  calculateFairRefundCents,
  isPaidPlan,
} from "@/lib/billing-refund";
import {
  getStripeClient,
  getSubscriptionPeriodEnd,
  inferBillingIntervalFromSubscription,
  parseBillingInterval,
  parseCheckoutPlanType,
  resolveInvoiceSubscriptionId,
  resolveStripeCustomerId,
  resolveStripeSubscriptionId,
  resolveSubscriptionActivationUnix,
} from "@/lib/stripe";

interface UpsertUserPlanInput {
  userId: string;
  plan: Plan;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  billingInterval?: BillingInterval | null;
  planActivatedAt?: Date | null;
  planExpiresAt?: Date | null;
}

export async function upsertUserPlan(input: UpsertUserPlanInput) {
  const {
    userId,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    billingInterval,
    planActivatedAt,
    planExpiresAt,
  } = input;

  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
      billingInterval: billingInterval ?? null,
      planActivatedAt: planActivatedAt ?? null,
      planExpiresAt: planExpiresAt ?? null,
    },
    update: {
      plan,
      ...(stripeCustomerId !== undefined ? { stripeCustomerId } : {}),
      ...(stripeSubscriptionId !== undefined ? { stripeSubscriptionId } : {}),
      ...(billingInterval !== undefined ? { billingInterval } : {}),
      ...(planActivatedAt !== undefined ? { planActivatedAt } : {}),
      ...(planExpiresAt !== undefined ? { planExpiresAt } : {}),
    },
  });
}

export async function resetUserSubscription(userId: string) {
  await prisma.userSettings.update({
    where: { userId },
    data: {
      plan: "FREE",
      billingInterval: null,
      stripeSubscriptionId: null,
      planActivatedAt: null,
      planExpiresAt: null,
    },
  });
}

export function resolvePlanFromPriceId(
  priceId: string | null | undefined,
): Plan | null {
  if (!priceId) {
    return null;
  }

  const priceIds = [
    process.env.STRIPE_PRICE_ID_PRO?.trim(),
    process.env.STRIPE_PRICE_ID_PRO_ANNUAL?.trim(),
    process.env.STRIPE_PRICE_ID_AGENCY?.trim(),
    process.env.STRIPE_PRICE_ID_AGENCY_ANNUAL?.trim(),
  ];

  if (priceIds[0] && priceId === priceIds[0]) return "PRO";
  if (priceIds[1] && priceId === priceIds[1]) return "PRO";
  if (priceIds[2] && priceId === priceIds[2]) return "AGENCY";
  if (priceIds[3] && priceId === priceIds[3]) return "AGENCY";

  return null;
}

export function resolveBillingIntervalFromPriceId(
  priceId: string | null | undefined,
): BillingInterval | null {
  if (!priceId) {
    return null;
  }

  const proAnnual = process.env.STRIPE_PRICE_ID_PRO_ANNUAL?.trim();
  const agencyAnnual = process.env.STRIPE_PRICE_ID_AGENCY_ANNUAL?.trim();
  const proMonthly = process.env.STRIPE_PRICE_ID_PRO?.trim();
  const agencyMonthly = process.env.STRIPE_PRICE_ID_AGENCY?.trim();

  if (priceId === proAnnual || priceId === agencyAnnual) {
    return "ANNUAL";
  }

  if (priceId === proMonthly || priceId === agencyMonthly) {
    return "MONTHLY";
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

function buildSubscriptionSyncFields(
  subscription: Stripe.Subscription,
  existingActivatedAt: Date | null | undefined,
) {
  const activationUnix = resolveSubscriptionActivationUnix(subscription);
  const billingInterval =
    parseBillingInterval(subscription.metadata?.billingInterval) ??
    inferBillingIntervalFromSubscription(subscription);

  return {
    stripeSubscriptionId: subscription.id,
    billingInterval,
    planActivatedAt:
      existingActivatedAt ?? new Date(activationUnix * 1000),
  };
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

  const billingInterval =
    parseBillingInterval(session.metadata?.billingInterval) ??
    (subscription
      ? inferBillingIntervalFromSubscription(subscription)
      : "MONTHLY");

  const syncFields = subscription
    ? buildSubscriptionSyncFields(subscription, null)
    : {
        stripeSubscriptionId: subscriptionId,
        billingInterval,
        planActivatedAt: new Date(),
      };

  await upsertUserPlan({
    userId,
    plan: planType,
    stripeCustomerId,
    planExpiresAt,
    ...syncFields,
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

  const existingSettings = userId
    ? await prisma.userSettings.findUnique({
        where: { userId },
        select: { planActivatedAt: true },
      })
    : null;

  if (!userId && stripeCustomerId) {
    const settings = await prisma.userSettings.findFirst({
      where: { stripeCustomerId },
      select: { userId: true, planActivatedAt: true },
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

  const settingsForActivation =
    existingSettings ??
    (await prisma.userSettings.findUnique({
      where: { userId },
      select: { planActivatedAt: true },
    }));

  const planExpiresAt = await safeSubscriptionPeriodEnd(subscription.id);
  const syncFields = buildSubscriptionSyncFields(
    subscription,
    settingsForActivation?.planActivatedAt,
  );

  if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "incomplete_expired"
  ) {
    await upsertUserPlan({
      userId,
      plan: "FREE",
      stripeCustomerId,
      stripeSubscriptionId: null,
      billingInterval: null,
      planActivatedAt: null,
      planExpiresAt: null,
    });
    return;
  }

  await upsertUserPlan({
    userId,
    plan,
    stripeCustomerId,
    planExpiresAt,
    ...syncFields,
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

export async function cancelSubscriptionWithFairRefund(userId: string) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings?.stripeCustomerId) {
    throw new Error("No Stripe billing profile found for this account.");
  }

  if (!isPaidPlan(settings.plan)) {
    throw new Error("You are not on a paid subscription plan.");
  }

  const stripe = getStripeClient();
  let subscription: Stripe.Subscription | undefined;

  if (settings.stripeSubscriptionId) {
    subscription = await stripe.subscriptions.retrieve(settings.stripeSubscriptionId);
  } else {
    const subscriptions = await stripe.subscriptions.list({
      customer: settings.stripeCustomerId,
      status: "active",
      limit: 1,
    });
    subscription = subscriptions.data[0];
  }

  if (!subscription || subscription.status !== "active") {
    throw new Error("No active subscription found to cancel.");
  }

  const billingInterval =
    settings.billingInterval ?? inferBillingIntervalFromSubscription(subscription);
  const activationUnix = resolveSubscriptionActivationUnix(subscription);
  const daysUsed = calculateDaysUsedSinceActivation(activationUnix);

  const invoices = await stripe.invoices.list({
    subscription: subscription.id,
    status: "paid",
    limit: 1,
  });
  const latestInvoice = invoices.data[0];
  const amountPaidCents = latestInvoice?.amount_paid ?? 0;

  const refundCents = calculateFairRefundCents({
    plan: settings.plan,
    billingInterval,
    daysUsed,
    amountPaidCents,
  });

  if (refundCents > 0 && latestInvoice) {
    const invoiceWithPayment = latestInvoice as Stripe.Invoice & {
      payment_intent?: string | Stripe.PaymentIntent | null;
      charge?: string | Stripe.Charge | null;
    };
    const paymentIntent = invoiceWithPayment.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
    const chargeId =
      typeof invoiceWithPayment.charge === "string"
        ? invoiceWithPayment.charge
        : invoiceWithPayment.charge?.id;

    if (paymentIntentId) {
      await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundCents,
        reason: "requested_by_customer",
      });
    } else if (chargeId) {
      await stripe.refunds.create({
        charge: chargeId,
        amount: refundCents,
        reason: "requested_by_customer",
      });
    }
  }

  await stripe.subscriptions.cancel(subscription.id);
  await resetUserSubscription(userId);

  return {
    refundCents,
    daysUsed,
    billingInterval,
  };
}
