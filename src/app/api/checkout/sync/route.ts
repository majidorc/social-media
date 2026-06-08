import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/get-current-user";
import { syncPlanFromCheckoutSession } from "@/lib/subscription-sync";

export const runtime = "nodejs";

const syncSchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid sync payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await syncPlanFromCheckoutSession(
      parsed.data.sessionId,
      user.id,
    );

    return NextResponse.json({ success: true, plan: result.plan });
  } catch (error) {
    console.error("[POST /api/checkout/sync]", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to sync checkout session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
