import { NextResponse } from "next/server";
import { z } from "zod";
import { appUrl } from "@/lib/auth";
import { requireCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  getStripeClient,
  getStripePriceId,
  isCheckoutPlanType,
} from "@/lib/stripe";
import type { CheckoutSessionResponse } from "@/types";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  planType: z.string().refine(isCheckoutPlanType, {
    message: 'planType must be "PRO" or "AGENCY".',
  }),
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
    const stripe = getStripeClient();
    const priceId = getStripePriceId(planType);

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
      select: {
        stripeCustomerId: true,
      },
    });

    const successUrl = `${appUrl}/dashboard?checkout=success&plan=${planType}`;
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
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planType,
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
