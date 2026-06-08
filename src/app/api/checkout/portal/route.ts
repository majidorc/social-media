import { NextResponse } from "next/server";
import { appUrl } from "@/lib/auth";
import { requireCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import type { CheckoutSessionResponse } from "@/types";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireCurrentUser();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { stripeCustomerId: true },
    });

    if (!settings?.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "No Stripe billing profile found. Upgrade to a paid plan before managing billing.",
        },
        { status: 400 },
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: settings.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a billing portal URL." },
        { status: 502 },
      );
    }

    const response: CheckoutSessionResponse = { url: session.url };
    return NextResponse.json(response);
  } catch (error) {
    console.error("[POST /api/checkout/portal]", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to open the billing portal.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
