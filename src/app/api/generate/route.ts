import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import {
  isImageModelAvailable,
  isModelAvailable,
} from "@/lib/ai/available-models";
import {
  generateContentWithVisuals,
  MissingApiKeyError,
} from "@/lib/ai/generate-content";
import { imageModelSchema, textModelSchema } from "@/lib/ai/models";
import { getDefaultModel, getSettings } from "@/lib/actions/settings";
import { requireCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  getHistoryCutoffDate,
  resolveUserPlanFeatures,
} from "@/lib/subscription";
import { toWorkspaceHistoryItem } from "@/lib/workspace-history";
import { deleteAllWorkspacesForUser } from "@/lib/workspace-delete";
import type {
  ClearHistoryResponse,
  GenerateResponse,
  GenerationHistoryResponse,
} from "@/types";

export const maxDuration = 300;

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
  aiModel: textModelSchema.optional(),
  imageModel: imageModelSchema.optional(),
  enableVideo: z.boolean().optional().default(false),
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

    const user = await requireCurrentUser();
    const userSettings =
      user.settings ??
      (await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      }));
    const planFeatures = resolveUserPlanFeatures(userSettings);

    if (parsed.data.platforms.length > planFeatures.maxPlatforms) {
      return NextResponse.json(
        {
          error:
            planFeatures.maxPlatforms === 1
              ? "Free plan supports one platform per generation. Upgrade to Pro for multi-platform output."
              : "Too many platforms selected for your plan.",
        },
        { status: 403 },
      );
    }

    const [settings, resolvedDefault] = await Promise.all([
      getSettings(),
      getDefaultModel(),
    ]);

    let textModel: string | null = resolvedDefault;

    if (parsed.data.aiModel) {
      const available = await isModelAvailable(
        user.id,
        parsed.data.aiModel,
        settings.apiKeys,
        { refresh: true },
      );

      if (!available) {
        return NextResponse.json(
          {
            error:
              "That text model is not available for your configured API keys.",
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

    const imageModel = parsed.data.imageModel;

    if (imageModel) {
      const imageAvailable = await isImageModelAvailable(
        user.id,
        imageModel,
        settings.apiKeys,
        { refresh: true },
      );

      if (!imageAvailable) {
        return NextResponse.json(
          {
            error:
              "That image model is not available for your configured API keys.",
          },
          { status: 400 },
        );
      }
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
        enableVideo: parsed.data.enableVideo,
      },
      textModel,
      imageModel,
      settings.watermarkLogoUrl,
      settings.watermarkPosition,
      {
        companyName: settings.companyName,
        businessDescription: settings.businessDescription,
        websiteUrl: settings.websiteUrl,
        socialHandle: settings.socialHandle,
      },
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
        enableVideo: parsed.data.enableVideo,
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
    const user = await requireCurrentUser();
    const userSettings =
      user.settings ??
      (await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      }));
    const historyCutoff = getHistoryCutoffDate(userSettings);

    const history = await prisma.contentWorkspace.findMany({
      where: {
        userId: user.id,
        ...(historyCutoff ? { createdAt: { gte: historyCutoff } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        idea: true,
        platforms: true,
        aiModel: true,
        imageModel: true,
        scheduledFor: true,
        createdAt: true,
        outputs: true,
      },
    });

    const response: GenerationHistoryResponse = {
      history: history.map(toWorkspaceHistoryItem),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/generate]", error);
    return NextResponse.json(
      { error: "Failed to fetch generation history" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const user = await requireCurrentUser();
    const deletedCount = await deleteAllWorkspacesForUser(user.id);

    const response: ClearHistoryResponse = {
      success: true,
      deletedCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DELETE /api/generate]", error);
    return NextResponse.json(
      { error: "Failed to clear generation history." },
      { status: 500 },
    );
  }
}
