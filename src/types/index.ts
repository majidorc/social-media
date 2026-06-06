import type { Platform } from "@prisma/client";

export type { Platform, AiProvider } from "@prisma/client";

export interface PlatformOutput {
  platform: Platform;
  content: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface VisualOutput {
  imageUrl: string;
  promptUsed: string;
  imageModel: string;
}

export interface GenerationOutputs {
  platforms: PlatformOutput[];
  blendedPrompt: string;
  modelUsed: string;
  generatedAt: string;
  visualImagePrompt?: string;
  visuals?: VisualOutput;
}

export interface GenerationInput {
  idea?: string;
  imageUrls?: string[];
  linkUrl?: string;
  videoUrls?: string[];
  platforms: Platform[];
  aiModel?: string;
  imageModel?: string;
}

export interface ApiKeyStatus {
  provider: "OPENAI" | "ANTHROPIC" | "GOOGLE";
  configured: boolean;
  maskedKey: string | null;
}

export interface SettingsResponse {
  defaultAiModel: string;
  apiKeys: ApiKeyStatus[];
}

export interface GenerateResponse {
  workspaceId: string;
  outputs: GenerationOutputs;
}

export interface WorkspaceHistoryItem {
  id: string;
  idea: string | null;
  platforms: Platform[];
  aiModel: string;
  imageModel: string | null;
  createdAt: string;
}

export interface WorkspaceDetail extends WorkspaceHistoryItem {
  imageUrls: string[];
  linkUrl: string | null;
  videoUrls: string[];
  outputs: GenerationOutputs;
}

export interface GenerationHistoryResponse {
  history: WorkspaceHistoryItem[];
}

export interface WorkspaceDetailResponse {
  workspace: WorkspaceDetail;
}

export type { LiveModelCatalog, LiveModelOption } from "@/lib/ai/model-types";
