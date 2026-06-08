import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/get-current-user";
import { syncPlanForUser } from "@/lib/subscription-sync";

export const runtime = "nodejs";

const EXPECTED_CLIENT_ERRORS = new Set([
  "No Stripe customer found for this account.",
  "No active subscription found.",
  "Could not determine subscription plan.",
]);

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const result = await syncPlanForUser(user.id, user.email);

    return NextResponse.json({ success: true, plan: result.plan });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to restore subscription.";

    if (error instanceof Error && EXPECTED_CLIENT_ERRORS.has(error.message)) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    console.error("[POST /api/checkout/restore]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
