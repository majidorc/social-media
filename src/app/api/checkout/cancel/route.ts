import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/get-current-user";
import { cancelSubscriptionWithFairRefund } from "@/lib/subscription-sync";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const result = await cancelSubscriptionWithFairRefund(user.id);

    const refundUsd = (result.refundCents / 100).toFixed(2);

    let message = "Your subscription was cancelled.";

    if (result.refundExecuted && result.refundCents > 0) {
      message = `Your subscription was cancelled. $${refundUsd} has been refunded to your card based on fair proration.`;
    } else if (result.billingInterval === "MONTHLY") {
      message =
        "Your subscription was cancelled. Stripe applied standard monthly proration to your billing account.";
    }

    return NextResponse.json({
      success: true,
      refundAmountCents: result.refundCents,
      refundExecuted: result.refundExecuted,
      message,
    });
  } catch (error) {
    console.error("[POST /api/checkout/cancel]", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to cancel subscription.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
