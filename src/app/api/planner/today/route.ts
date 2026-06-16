import { NextResponse } from "next/server";
import { getScheduledWorkspacesForMonth } from "@/lib/actions/planner";
import {
  getTodayUtcDateKey,
  getTodayUtcParts,
  scheduledDateKey,
} from "@/lib/planner-calendar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { year, month } = getTodayUtcParts();
    const items = await getScheduledWorkspacesForMonth(year, month);
    const todayKey = getTodayUtcDateKey();

    const dueToday = items.filter(
      (item) => scheduledDateKey(item.scheduledFor) === todayKey,
    );

    return NextResponse.json({ items: dueToday, date: todayKey });
  } catch (error) {
    console.error("[GET /api/planner/today]", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to load today's scheduled posts." },
      { status: 500 },
    );
  }
}
