import { NextResponse } from "next/server";
import { z } from "zod";
import { appUrl } from "@/lib/auth";
import { requireCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  changeUserSubscription,
  getActiveSubscriptionForUser,
} from "@/lib/subscription-sync";
import {
  getStripeClient,
  getStripePriceId,
  isBillingInterval,
  isCheckoutPlanType,
} from "@/lib/stripe";
import type { CheckoutSessionResponse } from "@/types";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  planType: z.string().refine(isCheckoutPlanType, {
    message: 'planType must be "PRO" or "AGENCY".',
  }),
  billingInterval: z
    .string()
    .refine(isBillingInterval, {
      message: 'billingInterval must be "MONTHLY" or "ANNUAL".',
    })
    .default("MONTHLY"),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const planType = parsed.data.planType;
    const billingInterval = parsed.data.billingInterval;

    const activeSubscription = await getActiveSubscriptionForUser(user.id);

    if (activeSubscription) {
      try {
        const changeResult = await changeUserSubscription(
          user.id,
          planType,
          billingInterval,
        );

        const response: CheckoutSessionResponse = {
          updated: true,
          plan: changeResult.plan,
          billingInterval: changeResult.billingInterval,
          message: changeResult.message,
        };

        return NextResponse.json(response);
      } catch (changeError) {
        if (
          changeError instanceof Error &&
          changeError.message === "ALREADY_ON_PLAN"
        ) {
          return NextResponse.json(
            { error: "You are already on this plan and billing cycle." },
            { status: 400 },
          );
        }

        throw changeError;
      }
    }

    const stripe = getStripeClient();
    const priceId = getStripePriceId(planType, billingInterval);

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
      select: {
        stripeCustomerId: true,
      },
    });

    const successUrl = `${appUrl}/dashboard?checkout=success&plan=${planType}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appUrl}/settings?checkout=cancelled`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planType,
        billingInterval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planType,
          billingInterval,
        },
      },
      ...(settings.stripeCustomerId
        ? { customer: settings.stripeCustomerId }
        : user.email
          ? { customer_email: user.email }
          : {}),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    const response: CheckoutSessionResponse = {
      url: session.url,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[POST /api/checkout]", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to create checkout session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
