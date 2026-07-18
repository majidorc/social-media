import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  isImageModelAvailable,
  isModelAvailable,
} from "@/lib/ai/available-models";
import {
  MissingApiKeyError,
  regenerateImageOnly,
  regenerateTextOnly,
} from "@/lib/ai/generate-content";
import { getSettings } from "@/lib/actions/settings";
import { requireCurrentUser } from "@/lib/get-current-user";
import {
  isOversizedDataUrl,
  optimizeGeneratedImageDataUrl,
} from "@/lib/image/optimize";
import { prisma } from "@/lib/prisma";
import { deleteWorkspaceForUser } from "@/lib/workspace-delete";
import {
  parseGenerationOutputs,
  toWorkspaceDetail,
} from "@/lib/workspace-history";
import type {
  DeleteWorkspaceResponse,
  GenerationInput,
  GenerationOutputs,
  RegenerateResponse,
  WorkspaceDetailResponse,
} from "@/types";

export const maxDuration = 300;

interface RouteContext {
  params: Promise<{ id: string }>;
}

const regenerateSchema = z.object({
  mode: z.enum(["text", "image"]),
});

async function shrinkOversizedVisuals(
  outputs: GenerationOutputs,
): Promise<{ outputs: GenerationOutputs; changed: boolean }> {
  const imageUrl = outputs.visuals?.imageUrl;
  if (!imageUrl || !isOversizedDataUrl(imageUrl)) {
    return { outputs, changed: false };
  }

  const optimizedImageUrl = await optimizeGeneratedImageDataUrl(imageUrl);
  if (optimizedImageUrl === imageUrl) {
    return { outputs, changed: false };
  }

  return {
    outputs: {
      ...outputs,
      visuals: {
        ...outputs.visuals!,
        imageUrl: optimizedImageUrl,
      },
    },
    changed: true,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;

    const workspace = await prisma.contentWorkspace.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    let outputs = parseGenerationOutputs(workspace.outputs);
    const shrunk = await shrinkOversizedVisuals(outputs);

    if (shrunk.changed) {
      outputs = shrunk.outputs;
      await prisma.contentWorkspace.update({
        where: { id: workspace.id },
        data: {
          outputs: outputs as unknown as Prisma.InputJsonValue,
        },
      });
    }

    const response: WorkspaceDetailResponse = {
      workspace: {
        ...toWorkspaceDetail(workspace),
        outputs,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/generate/[id]]", error);
    return NextResponse.json(
      { error: "Failed to load generation." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const body = await request.json();
    const parsed = regenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const workspace = await prisma.contentWorkspace.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    const previous = parseGenerationOutputs(workspace.outputs);
    const settings = await getSettings();
    const input: GenerationInput = {
      idea: workspace.idea ?? undefined,
      imageUrls: workspace.imageUrls,
      linkUrl: workspace.linkUrl ?? undefined,
      videoUrls: workspace.videoUrls,
      platforms: workspace.platforms,
      aiModel: workspace.aiModel,
      imageModel: workspace.imageModel ?? undefined,
      enableVideo: workspace.enableVideo,
    };

    let outputs = previous;

    if (parsed.data.mode === "text") {
      const available = await isModelAvailable(
        user.id,
        workspace.aiModel,
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

      outputs = await regenerateTextOnly(
        input,
        workspace.aiModel,
        previous,
        {
          companyName: settings.companyName,
          businessDescription: settings.businessDescription,
          websiteUrl: settings.websiteUrl,
          socialHandle: settings.socialHandle,
        },
      );
    } else {
      const imageModel =
        workspace.imageModel ?? previous.visuals?.imageModel ?? null;

      if (!imageModel) {
        return NextResponse.json(
          {
            error:
              "No image model on this generation. Pick an image model and generate again first.",
          },
          { status: 400 },
        );
      }

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

      outputs = await regenerateImageOnly(
        input,
        imageModel,
        previous,
        settings.watermarkLogoUrl,
        settings.watermarkPosition,
      );
    }

    const updated = await prisma.contentWorkspace.update({
      where: { id: workspace.id },
      data: {
        outputs: outputs as unknown as Prisma.InputJsonValue,
      },
    });

    const response: RegenerateResponse = {
      workspaceId: updated.id,
      mode: parsed.data.mode,
      outputs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[POST /api/generate/[id]]", error);

    if (error instanceof MissingApiKeyError) {
      return NextResponse.json(
        {
          error: `Add your ${error.provider} API key in Settings before regenerating.`,
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to regenerate content";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;

    const deleted = await deleteWorkspaceForUser(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    const response: DeleteWorkspaceResponse = {
      success: true,
      deletedId: id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DELETE /api/generate/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete generation." },
      { status: 500 },
    );
  }
}
