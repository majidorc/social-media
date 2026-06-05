import type { AiModel, Platform } from "@prisma/client";

export type { AiModel, Platform, AiProvider } from "@prisma/client";

export interface PlatformOutput {
  platform: Platform;
  content: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface GenerationOutputs {
  platforms: PlatformOutput[];
  blendedPrompt: string;
  modelUsed: AiModel;
  generatedAt: string;
}

export interface GenerationInput {
  idea?: string;
  imageUrls?: string[];
  linkUrl?: string;
  videoUrls?: string[];
  platforms: Platform[];
  aiModel?: AiModel;
}

export interface ApiKeyStatus {
  provider: "OPENAI" | "ANTHROPIC" | "GOOGLE";
  configured: boolean;
  maskedKey: string | null;
}

export interface SettingsResponse {
  defaultAiModel: AiModel;
  apiKeys: ApiKeyStatus[];
}

export interface GenerateResponse {
  workspaceId: string;
  outputs: GenerationOutputs;
}
