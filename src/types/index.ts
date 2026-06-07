import type { Platform, WatermarkPosition } from "@prisma/client";

export type { Platform, AiProvider, WatermarkPosition } from "@prisma/client";

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

export interface VideoOutput {
  url: string;
  script: string;
  voiceoverCopy: string;
}

export interface GenerationUsage {
  promptTokens: number;
  completionTokens: number;
  imageCount: number;
  totalCost: number;
}

export interface GenerationOutputs {
  platforms: PlatformOutput[];
  blendedPrompt: string;
  modelUsed: string;
  generatedAt: string;
  visualImagePrompt?: string;
  visuals?: VisualOutput;
  video?: VideoOutput;
  usage?: GenerationUsage;
}

export interface GenerationInput {
  idea?: string;
  imageUrls?: string[];
  linkUrl?: string;
  videoUrls?: string[];
  platforms: Platform[];
  aiModel?: string;
  imageModel?: string;
  enableVideo?: boolean;
}

export interface ApiKeyStatus {
  provider: "OPENAI" | "ANTHROPIC" | "GOOGLE";
  configured: boolean;
  maskedKey: string | null;
}

export interface SettingsResponse {
  defaultAiModel: string;
  watermarkLogoUrl: string | null;
  watermarkPosition: WatermarkPosition;
  companyName: string | null;
  businessDescription: string | null;
  websiteUrl: string | null;
  socialHandle: string | null;
  apiKeys: ApiKeyStatus[];
}

export interface GenerateResponse {
  workspaceId: string;
  outputs: GenerationOutputs;
}

export interface WorkspaceHistoryItem {
  id: string;
  idea: string | null;
  displayTitle: string;
  platforms: Platform[];
  aiModel: string;
  imageModel: string | null;
  scheduledFor: string | null;
  createdAt: string;
}

export interface WorkspaceDetail extends WorkspaceHistoryItem {
  imageUrls: string[];
  linkUrl: string | null;
  videoUrls: string[];
  enableVideo: boolean;
  outputs: GenerationOutputs;
}

export interface GenerationHistoryResponse {
  history: WorkspaceHistoryItem[];
}

export interface WorkspaceDetailResponse {
  workspace: WorkspaceDetail;
}

export interface DeleteWorkspaceResponse {
  success: true;
  deletedId: string;
}

export interface ClearHistoryResponse {
  success: true;
  deletedCount: number;
}

export interface HistoryMutationErrorResponse {
  error: string;
}

export interface ScheduledWorkspaceItem {
  id: string;
  idea: string | null;
  platforms: Platform[];
  scheduledFor: string;
  outputs: GenerationOutputs;
}

export interface PlannerMonthResponse {
  year: number;
  month: number;
  items: ScheduledWorkspaceItem[];
}

export interface ScheduleWorkspaceResult {
  success: boolean;
  message: string;
  scheduledFor?: string;
}

export type { LiveModelCatalog, LiveModelOption } from "@/lib/ai/model-types";
export type { BrandProfileContext } from "@/lib/brand-profile";
