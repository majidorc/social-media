import type { Prisma } from "@prisma/client";
import { resolveHistoryItemTitle } from "@/lib/history-display";
import type {
  GenerationOutputs,
  WorkspaceDetail,
  WorkspaceHistoryItem,
} from "@/types";

type WorkspaceRecord = {
  id: string;
  idea: string | null;
  imageUrls: string[];
  linkUrl: string | null;
  videoUrls: string[];
  platforms: WorkspaceHistoryItem["platforms"];
  aiModel: string;
  imageModel: string | null;
  enableVideo: boolean;
  scheduledFor: Date | null;
  outputs: Prisma.JsonValue;
  createdAt: Date;
};

export function parseGenerationOutputs(value: Prisma.JsonValue): GenerationOutputs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid workspace outputs.");
  }

  const record = value as Record<string, unknown>;

  if (
    !Array.isArray(record.platforms) ||
    typeof record.blendedPrompt !== "string" ||
    typeof record.modelUsed !== "string"
  ) {
    throw new Error("Invalid workspace outputs.");
  }

  return record as unknown as GenerationOutputs;
}

export function toWorkspaceHistoryItem(
  workspace: Pick<
    WorkspaceRecord,
    | "id"
    | "idea"
    | "platforms"
    | "aiModel"
    | "imageModel"
    | "scheduledFor"
    | "createdAt"
  > & { outputs?: Prisma.JsonValue },
): WorkspaceHistoryItem {
  return {
    id: workspace.id,
    idea: workspace.idea,
    displayTitle: resolveHistoryItemTitle(workspace.idea, workspace.outputs),
    platforms: workspace.platforms,
    aiModel: workspace.aiModel,
    imageModel: workspace.imageModel,
    scheduledFor: workspace.scheduledFor?.toISOString() ?? null,
    createdAt: workspace.createdAt.toISOString(),
  };
}

export function toWorkspaceDetail(workspace: WorkspaceRecord): WorkspaceDetail {
  return {
    ...toWorkspaceHistoryItem(workspace),
    imageUrls: workspace.imageUrls,
    linkUrl: workspace.linkUrl,
    videoUrls: workspace.videoUrls,
    enableVideo: workspace.enableVideo,
    outputs: parseGenerationOutputs(workspace.outputs),
  };
}
