import { NextResponse } from "next/server";
import { z } from "zod";
import type { AiImageModel, AiModel, Prisma } from "@prisma/client";
import {
  isImageModelAvailable,
  isModelAvailable,
} from "@/lib/ai/available-models";
import {
  generateContentWithVisuals,
  MissingApiKeyError,
} from "@/lib/ai/generate-content";
import { aiImageModelSchema, aiModelSchema } from "@/lib/ai/models";
import { getDefaultModel, getSettings } from "@/lib/actions/settings";
import { getDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import type { GenerateResponse } from "@/types";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().url().safeParse(value).success, {
    message: "Must be a valid URL",
  });

const generateSchema = z.object({
  idea: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional().default([]),
  linkUrl: optionalUrl,
  videoUrls: z.array(z.string().url()).optional().default([]),
  platforms: z
    .array(
      z.enum([
        "INSTAGRAM",
        "TWITTER",
        "LINKEDIN",
        "TIKTOK",
        "YOUTUBE",
        "FACEBOOK",
      ]),
    )
    .min(1, "Select at least one platform"),
  aiModel: aiModelSchema.optional(),
  imageModel: aiImageModelSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await getDemoUser();
    const [settings, resolvedDefault] = await Promise.all([
      getSettings(),
      getDefaultModel(),
    ]);

    let textModel: AiModel | null = resolvedDefault;

    if (parsed.data.aiModel) {
      if (!isModelAvailable(parsed.data.aiModel, settings.apiKeys)) {
        return NextResponse.json(
          {
            error:
              "That text model requires an API key you have not configured yet. Update Settings or pick another model.",
          },
          { status: 400 },
        );
      }

      textModel = parsed.data.aiModel;
    }

    if (!textModel) {
      return NextResponse.json(
        { error: "Add an API key in Settings before generating content." },
        { status: 400 },
      );
    }

    const imageModel: AiImageModel | undefined = parsed.data.imageModel;

    if (imageModel && !isImageModelAvailable(imageModel, settings.apiKeys)) {
      return NextResponse.json(
        {
          error:
            "That image model requires an API key you have not configured yet. Update Settings or pick another model.",
        },
        { status: 400 },
      );
    }

    const linkUrl = parsed.data.linkUrl?.trim() || undefined;

    const outputs = await generateContentWithVisuals(
      {
        idea: parsed.data.idea,
        imageUrls: parsed.data.imageUrls,
        linkUrl,
        videoUrls: parsed.data.videoUrls,
        platforms: parsed.data.platforms,
        aiModel: textModel,
        imageModel,
      },
      textModel,
      imageModel,
    );

    const workspace = await prisma.contentWorkspace.create({
      data: {
        userId: user.id,
        idea: parsed.data.idea,
        imageUrls: parsed.data.imageUrls ?? [],
        linkUrl,
        videoUrls: parsed.data.videoUrls ?? [],
        platforms: parsed.data.platforms,
        aiModel: textModel,
        imageModel: imageModel ?? null,
        outputs: outputs as unknown as Prisma.InputJsonValue,
      },
    });

    const response: GenerateResponse = {
      workspaceId: workspace.id,
      outputs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[POST /api/generate]", error);

    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error: `Add your ${error.provider} API key in Settings before generating.`,
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate content";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getDemoUser();

    const history = await prisma.contentWorkspace.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        idea: true,
        platforms: true,
        aiModel: true,
        imageModel: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[GET /api/generate]", error);
    return NextResponse.json(
      { error: "Failed to fetch generation history" },
      { status: 500 },
    );
  }
}
