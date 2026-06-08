import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  syncPlanFromCheckoutSessionEvent,
  syncPlanFromInvoice,
  syncPlanFromStripeSubscription,
} from "@/lib/subscription-sync";
import { getStripeClient, resolveStripeCustomerId } from "@/lib/stripe";

export const runtime = "nodejs";

async function resetUserPlanByCustomerId(customerId: string) {
  await prisma.userSettings.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      plan: "FREE",
      planExpiresAt: null,
    },
  });
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
        await syncPlanFromCheckoutSessionEvent(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncPlanFromStripeSubscription(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_succeeded":
        await syncPlanFromInvoice(event.data.object as Stripe.Invoice);
        break;
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = resolveStripeCustomerId(subscription.customer);

        if (customerId) {
          await resetUserPlanByCustomerId(customerId);
        }
        break;
      }
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
