import type { Plan, Platform, Role, WatermarkPosition, BillingInterval } from "@prisma/client";
import type { PlanFeatures } from "@/lib/plans";

export type { Platform, AiProvider, WatermarkPosition, Plan, Role, BillingInterval } from "@prisma/client";
export type CheckoutPlanType = Extract<Plan, "PRO" | "AGENCY">;
export type MarketingBillingInterval = "MONTHLY" | "ANNUAL";
export type { PlanFeatures } from "@/lib/plans";

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

export interface BrandProfileSummary {
  id: string;
  name: string;
  companyName: string | null;
  businessDescription: string | null;
  websiteUrl: string | null;
  socialHandle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  defaultAiModel: string;
  plan: Plan;
  billingInterval: BillingInterval | null;
  planActivatedAt: string | null;
  planExpiresAt: string | null;
  hasStripeCustomer: boolean;
  canRestoreSubscription: boolean;
  planFeatures: PlanFeatures;
  watermarkLogoUrl: string | null;
  watermarkPosition: WatermarkPosition;
  companyName: string | null;
  businessDescription: string | null;
  websiteUrl: string | null;
  socialHandle: string | null;
  apiKeys: ApiKeyStatus[];
  brandProfiles: BrandProfileSummary[];
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

export interface AdminUserRecord {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  plan: Plan;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserRecord[];
}

export interface AdminUpdateUserRequest {
  userId: string;
  role?: Role;
  plan?: Plan;
}

export interface AdminUpdateUserResponse {
  success: boolean;
  message: string;
  user?: AdminUserRecord;
}

export interface CheckoutSessionResponse {
  url?: string;
  updated?: boolean;
  plan?: Plan;
  billingInterval?: BillingInterval;
  message?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  refundAmountCents: number;
  message: string;
}
