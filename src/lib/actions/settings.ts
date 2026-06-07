
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AiProvider } from "@prisma/client";
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
import type { ApiKeyStatus, SettingsResponse } from "@/types";

const MAX_WATERMARK_BYTES = 2 * 1024 * 1024;

const saveApiKeysSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
});

const saveDefaultModelSchema = z.object({
  defaultAiModel: textModelSchema,
});

export async function getSettings(): Promise<SettingsResponse> {
  const user = await requireCurrentUser();

  const settings = await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: user.id },
  });

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
    watermarkLogoUrl: settings.watermarkLogoUrl,
    apiKeys: apiKeyStatuses,
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
