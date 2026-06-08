import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  getSubscriptionPeriodEnd,
  parseCheckoutPlanType,
  resolveInvoiceSubscriptionId,
  resolveStripeCustomerId,
  resolveStripeSubscriptionId,
} from "@/lib/stripe";

export const runtime = "nodejs";

async function upsertUserPlan(input: {
  userId: string;
  plan: Plan;
  stripeCustomerId?: string | null;
  planExpiresAt?: Date | null;
}) {
  await prisma.userSettings.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      plan: input.plan,
      stripeCustomerId: input.stripeCustomerId ?? null,
      planExpiresAt: input.planExpiresAt ?? null,
    },
    update: {
      plan: input.plan,
      ...(input.stripeCustomerId !== undefined
        ? { stripeCustomerId: input.stripeCustomerId }
        : {}),
      ...(input.planExpiresAt !== undefined
        ? { planExpiresAt: input.planExpiresAt }
        : {}),
    },
  });
}

async function resetUserPlanByCustomerId(customerId: string) {
  await prisma.userSettings.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "FREE",
      planExpiresAt: null,
    },
  });
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planType = parseCheckoutPlanType(
    session.metadata?.planType ?? session.metadata?.plan,
  );

  if (!userId || !planType) {
    console.error("[stripe webhook] checkout.session.completed missing metadata", {
      sessionId: session.id,
      metadata: session.metadata,
    });
    return;
  }

  const stripeCustomerId = resolveStripeCustomerId(session.customer);
  const subscriptionId = resolveStripeSubscriptionId(session.subscription);
  const planExpiresAt = subscriptionId
    ? await getSubscriptionPeriodEnd(subscriptionId)
    : null;

  await upsertUserPlan({
    userId,
    plan: planType,
    stripeCustomerId,
    planExpiresAt,
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = resolveStripeCustomerId(invoice.customer);
  const subscriptionId = resolveInvoiceSubscriptionId(invoice);

  if (!customerId || !subscriptionId) {
    return;
  }

  const planExpiresAt = await getSubscriptionPeriodEnd(subscriptionId);

  if (!planExpiresAt) {
    return;
  }

  await prisma.userSettings.updateMany({
    where: { stripeCustomerId: customerId },
    data: { planExpiresAt },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = resolveStripeCustomerId(subscription.customer);

  if (!customerId) {
    return;
  }

  await resetUserPlanByCustomerId(customerId);
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET is not configured.");
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[stripe webhook] Handler failed for ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }
}
