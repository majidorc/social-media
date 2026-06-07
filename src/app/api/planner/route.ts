import { NextResponse } from "next/server";
import { getScheduledWorkspacesForMonth } from "@/lib/actions/planner";
import type { PlannerMonthResponse } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return NextResponse.json(
        { error: "Provide valid year and month query params." },
        { status: 400 },
      );
    }

    const items = await getScheduledWorkspacesForMonth(year, month);

    const response: PlannerMonthResponse = {
      year,
      month,
      items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/planner]", error);
    return NextResponse.json(
      { error: "Failed to load scheduled content." },
      { status: 500 },
    );
  }
}
