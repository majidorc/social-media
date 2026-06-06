import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/get-current-user";
import {
  getLiveModelCatalog,
  invalidateModelCatalogCache,
} from "@/lib/ai/available-models";
import { getSettings } from "@/lib/actions/settings";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const refresh = new URL(request.url).searchParams.get("refresh") === "true";

    if (refresh) {
      invalidateModelCatalogCache(user.id);
    }

    const settings = await getSettings();
    const catalog = await getLiveModelCatalog(user.id, settings.apiKeys, {
      refresh,
    });

    return NextResponse.json(catalog);
  } catch (error) {
    console.error("[GET /api/models]", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to load available models." },
      { status: 500 },
    );
  }
}
