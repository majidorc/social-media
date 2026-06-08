import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/get-current-user";
import { syncPlanForUser } from "@/lib/subscription-sync";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await requireCurrentUser();
    const result = await syncPlanForUser(user.id, user.email);

    return NextResponse.json({ success: true, plan: result.plan });
  } catch (error) {
    console.error("[POST /api/checkout/restore]", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to restore subscription.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
