
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AiProvider, WatermarkPosition } from "@prisma/client";
import sharp from "sharp";
import { requireCurrentUser } from "@/lib/get-current-user";
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { API_KEY_PROVIDERS } from "@/lib/constants";
import {
  getLiveModelCatalog,
  invalidateModelCatalogCache,
  resolveDefaultModel,
} from "@/lib/ai/available-models";
import { findModelOption, textModelSchema } from "@/lib/ai/models";
import { resolveWatermarkPosition } from "@/lib/watermark-position";
import { normalizeBrandProfileField } from "@/lib/brand-profile";
import {
  getEffectivePlan,
  getMaxBrandProfiles,
  isWatermarkPositionAllowed,
  resolveAllowedWatermarkPosition,
  resolveUserPlanFeatures,
} from "@/lib/subscription";
import type { ApiKeyStatus, BrandProfileSummary, SettingsResponse } from "@/types";

const MAX_WATERMARK_BYTES = 2 * 1024 * 1024;

const saveApiKeysSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
});

const saveDefaultModelSchema = z.object({
  defaultAiModel: textModelSchema,
});

const saveWatermarkPositionSchema = z.enum([
  "TOP_LEFT",
  "TOP_RIGHT",
  "BOTTOM_LEFT",
  "BOTTOM_RIGHT",
  "CENTER",
]);

const optionalWebsiteUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().url().safeParse(value).success, {
    message: "Enter a valid website URL.",
  });

const saveBrandProfileSchema = z.object({
  companyName: z.string().trim().max(200).optional(),
  businessDescription: z.string().trim().max(5000).optional(),
  websiteUrl: optionalWebsiteUrl,
  socialHandle: z.string().trim().max(100).optional(),
});

const createBrandProfileSchema = saveBrandProfileSchema.extend({
  name: z.string().trim().min(1, "Enter a profile name.").max(100),
});

function toBrandProfileSummary(profile: {
  id: string;
  name: string;
  companyName: string | null;
  businessDescription: string | null;
  websiteUrl: string | null;
  socialHandle: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BrandProfileSummary {
  return {
    id: profile.id,
    name: profile.name,
    companyName: profile.companyName,
    businessDescription: profile.businessDescription,
    websiteUrl: profile.websiteUrl,
    socialHandle: profile.socialHandle,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function getSettings(): Promise<SettingsResponse> {
  const user = await requireCurrentUser();

  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  const [apiKeys, brandProfiles] = await Promise.all([
    prisma.apiKey.findMany({
      where: { userId: user.id },
    }),
    prisma.brandProfile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const plan = getEffectivePlan(settings);
  const planFeatures = resolveUserPlanFeatures(settings);

  const apiKeyStatuses: ApiKeyStatus[] = API_KEY_PROVIDERS.map(({ provider }) => {
    const record = apiKeys.find((key) => key.provider === provider);

    if (!record) {
      return { provider, configured: false, maskedKey: null };
    }

    const decrypted = decryptApiKey(record.encryptedKey);
    return {
      provider,
      configured: true,
      maskedKey: maskApiKey(decrypted),
    };
  });

  return {
    defaultAiModel: settings.defaultAiModel,
    plan,
    billingInterval: settings.billingInterval,
    planActivatedAt: settings.planActivatedAt?.toISOString() ?? null,
    planExpiresAt: settings.planExpiresAt?.toISOString() ?? null,
    hasStripeCustomer: Boolean(settings.stripeCustomerId),
    planFeatures,
    watermarkLogoUrl: settings.watermarkLogoUrl,
    watermarkPosition: resolveAllowedWatermarkPosition(
      settings,
      resolveWatermarkPosition(settings.watermarkPosition),
    ),
    companyName: settings.companyName,
    businessDescription: settings.businessDescription,
    websiteUrl: settings.websiteUrl,
    socialHandle: settings.socialHandle,
    apiKeys: apiKeyStatuses,
    brandProfiles: brandProfiles.map(toBrandProfileSummary),
  };
}

export async function saveApiKeys(
  input: z.infer<typeof saveApiKeysSchema>,
): Promise<{ success: boolean; message: string }> {
  const parsed = saveApiKeysSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: "Invalid API key payload." };
  }

  const user = await requireCurrentUser();
  const entries: { provider: AiProvider; value?: string }[] = [
    { provider: "OPENAI", value: parsed.data.openai },
    { provider: "ANTHROPIC", value: parsed.data.anthropic },
    { provider: "GOOGLE", value: parsed.data.google },
  ];

  for (const entry of entries) {
    const trimmed = entry.value?.trim();

    if (!trimmed) {
      continue;
    }

    await prisma.apiKey.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: entry.provider,
        },
      },
      create: {
        userId: user.id,
        provider: entry.provider,
        encryptedKey: encryptApiKey(trimmed),
      },
      update: {
        encryptedKey: encryptApiKey(trimmed),
      },
    });
  }

  invalidateModelCatalogCache(user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, message: "API keys saved securely." };
}

export async function saveDefaultModel(
  defaultAiModel: string,
): Promise<{ success: boolean; message: string }> {
  const parsed = saveDefaultModelSchema.safeParse({ defaultAiModel });

  if (!parsed.success) {
    return { success: false, message: "Invalid model selection." };
  }

  const user = await requireCurrentUser();
  const settings = await getSettings();
  const catalog = await getLiveModelCatalog(user.id, settings.apiKeys, {
    refresh: true,
  });

  if (catalog.textModels.length === 0) {
    return {
      success: false,
      message: "Add at least one API key before choosing a default model.",
    };
  }

  const selected = findModelOption(catalog.textModels, parsed.data.defaultAiModel);

  if (!selected) {
    return {
      success: false,
      message: "That model is not available for your configured API keys.",
    };
  }

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      defaultAiModel: selected.value,
    },
    update: {
      defaultAiModel: selected.value,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, message: "Default model updated." };
}

export async function getDefaultModel(): Promise<string | null> {
  const user = await requireCurrentUser();
  const settings = await getSettings();
  const catalog = await getLiveModelCatalog(user.id, settings.apiKeys);

  return resolveDefaultModel(settings.defaultAiModel, catalog.textModels);
}

async function validateWatermarkBuffer(buffer: Buffer): Promise<void> {
  if (buffer.length === 0) {
    throw new Error("Logo file is empty.");
  }

  if (buffer.length > MAX_WATERMARK_BYTES) {
    throw new Error("Logo must be 2 MB or smaller.");
  }

  const metadata = await sharp(buffer).metadata();

  if (metadata.format !== "png") {
    throw new Error("Upload a transparent PNG logo.");
  }
}

export async function saveWatermarkLogo(
  buffer: Buffer,
): Promise<{ success: boolean; message: string; watermarkLogoUrl?: string }> {
  try {
    await validateWatermarkBuffer(buffer);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Invalid logo file.",
    };
  }

  const user = await requireCurrentUser();
  const watermarkLogoUrl = `data:image/png;base64,${buffer.toString("base64")}`;

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      watermarkLogoUrl,
    },
    update: {
      watermarkLogoUrl,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Brand logo saved. New images will include this watermark.",
    watermarkLogoUrl,
  };
}

export async function removeWatermarkLogo(): Promise<{
  success: boolean;
  message: string;
}> {
  const user = await requireCurrentUser();

  await prisma.userSettings.updateMany({
    where: { userId: user.id },
    data: { watermarkLogoUrl: null },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Brand logo removed.",
  };
}

export async function saveWatermarkPosition(
  watermarkPosition: WatermarkPosition,
): Promise<{ success: boolean; message: string; watermarkPosition?: WatermarkPosition }> {
  const parsed = saveWatermarkPositionSchema.safeParse(watermarkPosition);

  if (!parsed.success) {
    return { success: false, message: "Invalid watermark position." };
  }

  const user = await requireCurrentUser();
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  if (!isWatermarkPositionAllowed(settings, parsed.data)) {
    return {
      success: false,
      message: "Upgrade to Pro to customize watermark placement.",
    };
  }

  const resolvedPosition = resolveAllowedWatermarkPosition(settings, parsed.data);

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { watermarkPosition: resolvedPosition },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Watermark position updated.",
    watermarkPosition: resolvedPosition,
  };
}

export async function saveBrandProfile(
  input: z.infer<typeof saveBrandProfileSchema>,
): Promise<{ success: boolean; message: string }> {
  const parsed = saveBrandProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid brand profile.",
    };
  }

  const user = await requireCurrentUser();

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      companyName: normalizeBrandProfileField(parsed.data.companyName),
      businessDescription: normalizeBrandProfileField(parsed.data.businessDescription),
      websiteUrl: normalizeBrandProfileField(parsed.data.websiteUrl),
      socialHandle: normalizeBrandProfileField(parsed.data.socialHandle),
    },
    update: {
      companyName: normalizeBrandProfileField(parsed.data.companyName),
      businessDescription: normalizeBrandProfileField(parsed.data.businessDescription),
      websiteUrl: normalizeBrandProfileField(parsed.data.websiteUrl),
      socialHandle: normalizeBrandProfileField(parsed.data.socialHandle),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Brand profile saved. Future generations will use this context.",
  };
}

export async function createBrandProfile(
  input: z.infer<typeof createBrandProfileSchema>,
): Promise<{ success: boolean; message: string; profile?: BrandProfileSummary }> {
  const parsed = createBrandProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid brand profile.",
    };
  }

  const user = await requireCurrentUser();
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  if (getMaxBrandProfiles(settings) <= 1) {
    return {
      success: false,
      message: "Upgrade to Agency to save multiple brand profiles.",
    };
  }

  const existingCount = await prisma.brandProfile.count({
    where: { userId: user.id },
  });

  if (existingCount >= getMaxBrandProfiles(settings)) {
    return {
      success: false,
      message: "You have reached the brand profile limit for your plan.",
    };
  }

  const profile = await prisma.brandProfile.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      companyName: normalizeBrandProfileField(parsed.data.companyName),
      businessDescription: normalizeBrandProfileField(parsed.data.businessDescription),
      websiteUrl: normalizeBrandProfileField(parsed.data.websiteUrl),
      socialHandle: normalizeBrandProfileField(parsed.data.socialHandle),
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Brand profile saved.",
    profile: toBrandProfileSummary(profile),
  };
}

export async function switchBrandProfile(
  profileId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await requireCurrentUser();
  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  if (getMaxBrandProfiles(settings) <= 1) {
    return {
      success: false,
      message: "Upgrade to Agency to switch between brand profiles.",
    };
  }

  const profile = await prisma.brandProfile.findFirst({
    where: {
      id: profileId,
      userId: user.id,
    },
  });

  if (!profile) {
    return { success: false, message: "Brand profile not found." };
  }

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: {
      companyName: profile.companyName,
      businessDescription: profile.businessDescription,
      websiteUrl: profile.websiteUrl,
      socialHandle: profile.socialHandle,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: `Switched to ${profile.name}.`,
  };
}

export async function deleteBrandProfile(
  profileId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await requireCurrentUser();

  const profile = await prisma.brandProfile.findFirst({
    where: {
      id: profileId,
      userId: user.id,
    },
  });

  if (!profile) {
    return { success: false, message: "Brand profile not found." };
  }

  await prisma.brandProfile.delete({
    where: { id: profile.id },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Brand profile deleted.",
  };
}

