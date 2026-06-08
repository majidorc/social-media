import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createBrandProfile,
  deleteBrandProfile,
  getSettings,
  saveApiKeys,
  saveBrandProfile,
  saveDefaultModel,
  switchBrandProfile,
} from "@/lib/actions/settings";
import { textModelSchema } from "@/lib/ai/models";

const saveKeysSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
});

const saveModelSchema = z.object({
  defaultAiModel: textModelSchema,
});

const optionalWebsiteUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().url().safeParse(value).success, {
    message: "Enter a valid website URL.",
  });

const saveBrandProfileSchema = z.object({
  companyName: z.string().trim().max(200).optional(),
  businessDescription: z.string().trim().max(5000).optional(),
  websiteUrl: optionalWebsiteUrl,
  socialHandle: z.string().trim().max(100).optional(),
});

const createBrandProfileSchema = saveBrandProfileSchema.extend({
  name: z.string().trim().min(1).max(100),
});

const profileIdSchema = z.object({
  profileId: z.string().min(1),
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

    if (action === "brand-profile") {
      const parsed = saveBrandProfileSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid brand profile payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const result = await saveBrandProfile(parsed.data);
      return NextResponse.json(result);
    }

    if (action === "brand-profile-create") {
      const parsed = createBrandProfileSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid brand profile payload", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const result = await createBrandProfile(parsed.data);
      return NextResponse.json(result);
    }

    if (action === "brand-profile-switch") {
      const parsed = profileIdSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid profile id", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const result = await switchBrandProfile(parsed.data.profileId);
      return NextResponse.json(result);
    }

    if (action === "brand-profile-delete") {
      const parsed = profileIdSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid profile id", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const result = await deleteBrandProfile(parsed.data.profileId);
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
