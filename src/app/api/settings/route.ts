import { NextResponse } from "next/server";
import { z } from "zod";
import { getSettings, saveApiKeys, saveDefaultModel } from "@/lib/actions/settings";
import { textModelSchema } from "@/lib/ai/models";

const saveKeysSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
});

const saveModelSchema = z.object({
  defaultAiModel: textModelSchema,
});

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[GET /api/settings]", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "model") {
      const parsed = saveModelSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid model payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const result = await saveDefaultModel(parsed.data.defaultAiModel);
      return NextResponse.json(result);
    }

    const parsed = saveKeysSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid API key payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await saveApiKeys(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[PUT /api/settings]", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
