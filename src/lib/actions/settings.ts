"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AiModel, AiProvider } from "@prisma/client";
import { getDemoUser } from "@/lib/demo-user";
import { decryptApiKey, encryptApiKey, maskApiKey } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { API_KEY_PROVIDERS } from "@/lib/constants";
import type { ApiKeyStatus, SettingsResponse } from "@/types";

const aiModelSchema = z.enum([
  "GPT_4O",
  "GPT_4O_MINI",
  "CLAUDE_35_SONNET",
  "GEMINI_15_PRO",
  "GEMINI_15_FLASH",
]);

const saveApiKeysSchema = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
});

const saveDefaultModelSchema = z.object({
  defaultAiModel: aiModelSchema,
});

export async function getSettings(): Promise<SettingsResponse> {
  const user = await getDemoUser();

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

  const user = await getDemoUser();
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

  revalidatePath("/settings");
  return { success: true, message: "API keys saved securely." };
}

export async function saveDefaultModel(
  defaultAiModel: AiModel,
): Promise<{ success: boolean; message: string }> {
  const parsed = saveDefaultModelSchema.safeParse({ defaultAiModel });

  if (!parsed.success) {
    return { success: false, message: "Invalid model selection." };
  }

  const user = await getDemoUser();

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      defaultAiModel: parsed.data.defaultAiModel,
    },
    update: {
      defaultAiModel: parsed.data.defaultAiModel,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true, message: "Default model updated." };
}

export async function getDefaultModel(): Promise<AiModel> {
  const settings = await getSettings();
  return settings.defaultAiModel;
}
