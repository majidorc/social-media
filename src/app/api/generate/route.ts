import { NextResponse } from "next/server";
import { z } from "zod";
import type { AiModel, Prisma } from "@prisma/client";
import {
  generateContent,
  MissingApiKeyError,
} from "@/lib/ai/generate-content";
import { aiModelSchema } from "@/lib/ai/models";
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
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    const model: AiModel = parsed.data.aiModel ?? settings.defaultAiModel;
    const linkUrl = parsed.data.linkUrl?.trim() || undefined;

    const outputs = await generateContent(
      {
        idea: parsed.data.idea,
        imageUrls: parsed.data.imageUrls,
        linkUrl,
        videoUrls: parsed.data.videoUrls,
        platforms: parsed.data.platforms,
        aiModel: model,
      },
      model,
    );

    const workspace = await prisma.contentWorkspace.create({
      data: {
        userId: user.id,
        idea: parsed.data.idea,
        imageUrls: parsed.data.imageUrls ?? [],
        linkUrl,
        videoUrls: parsed.data.videoUrls ?? [],
        platforms: parsed.data.platforms,
        aiModel: model,
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
