import type { AiImageModel, AiModel, Platform } from "@prisma/client";

export type { AiImageModel, AiModel, Platform, AiProvider } from "@prisma/client";

export interface PlatformOutput {
  platform: Platform;
  content: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface VisualOutput {
  imageUrl: string;
  promptUsed: string;
  imageModel: AiImageModel;
}

export interface GenerationOutputs {
  platforms: PlatformOutput[];
  blendedPrompt: string;
  modelUsed: AiModel;
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
  aiModel?: AiModel;
  imageModel?: AiImageModel;
}

export interface ApiKeyStatus {
  provider: "OPENAI" | "ANTHROPIC" | "GOOGLE";
  configured: boolean;
  maskedKey: string | null;
}

export interface SettingsResponse {
  defaultAiModel: AiModel;
  apiKeys: ApiKeyStatus[];
  availableModels: AiModel[];
  availableImageModels: AiImageModel[];
}

export interface GenerateResponse {
  workspaceId: string;
  outputs: GenerationOutputs;
}
