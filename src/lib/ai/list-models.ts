import type { AiProvider } from "@prisma/client";
import {
  normalizeModelId,
  providerDisplayName,
  resolveModelProvider,
} from "@/lib/ai/models";
import type { LiveModelOption } from "@/lib/ai/model-types";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  catalog: { textModels: LiveModelOption[]; imageModels: LiveModelOption[] };
}

const catalogCache = new Map<string, CacheEntry>();

const GOOGLE_IMAGEN_FALLBACKS: LiveModelOption[] = [
  {
    value: "imagen-4.0-generate-001",
    label: "Imagen 4",
    provider: "Google",
    apiProvider: "GOOGLE",
    kind: "image",
  },
  {
    value: "imagen-4.0-fast-generate-001",
    label: "Imagen 4 Fast",
    provider: "Google",
    apiProvider: "GOOGLE",
    kind: "image",
  },
  {
    value: "imagen-3.0-generate-002",
    label: "Imagen 3",
    provider: "Google",
    apiProvider: "GOOGLE",
    kind: "image",
  },
];

function isExcludedGoogleTextModel(modelId: string): boolean {
  const id = modelId.toLowerCase();
  return (
    id.includes("embed") ||
    id.includes("aqa") ||
    id.includes("text-embedding") ||
    id.includes("gemma") ||
    id.includes("learnlm") ||
    id.includes("tts") ||
    id.includes("live")
  );
}

function classifyGoogleModel(model: {
  name: string;
  displayName?: string;
  supportedGenerationMethods?: string[];
}): "text" | "image" | null {
  const modelId = normalizeModelId(model.name);
  const methods = model.supportedGenerationMethods ?? [];
  const id = modelId.toLowerCase();

  const supportsImage =
    methods.includes("predict") ||
    methods.includes("generateImages") ||
    id.includes("imagen");

  if (supportsImage) {
    return "image";
  }

  if (
    methods.includes("generateContent") &&
    !isExcludedGoogleTextModel(modelId)
  ) {
    return "text";
  }

  return null;
}

export async function listGoogleModels(
  apiKey: string,
): Promise<{ text: LiveModelOption[]; image: LiveModelOption[] }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google listModels failed (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    models?: Array<{
      name: string;
      displayName?: string;
      supportedGenerationMethods?: string[];
    }>;
  };

  const text: LiveModelOption[] = [];
  const image: LiveModelOption[] = [];
  const seenImage = new Set<string>();

  for (const model of data.models ?? []) {
    const kind = classifyGoogleModel(model);
    if (!kind) {
      continue;
    }

    const value = normalizeModelId(model.name);
    const option: LiveModelOption = {
      value,
      label: model.displayName ?? value,
      provider: "Google",
      apiProvider: "GOOGLE",
      kind,
    };

    if (kind === "text") {
      text.push(option);
    } else {
      image.push({ ...option, kind: "image" });
      seenImage.add(value);
    }
  }

  for (const fallback of GOOGLE_IMAGEN_FALLBACKS) {
    if (!seenImage.has(fallback.value)) {
      image.push(fallback);
    }
  }

  text.sort((a, b) => a.label.localeCompare(b.label));
  image.sort((a, b) => a.label.localeCompare(b.label));

  return { text, image };
}

export async function listOpenAIModels(
  apiKey: string,
): Promise<{ text: LiveModelOption[]; image: LiveModelOption[] }> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI listModels failed (${response.status}): ${error}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ id: string; owned_by?: string }>;
  };

  const text: LiveModelOption[] = [];
  const image: LiveModelOption[] = [];

  for (const model of data.data ?? []) {
    const id = model.id.toLowerCase();

    if (id.startsWith("dall-e") || id.includes("gpt-image")) {
      image.push({
        value: model.id,
        label: model.id,
        provider: "OpenAI",
        apiProvider: "OPENAI",
        kind: "image",
      });
      continue;
    }

    if (
      (id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3") || id.startsWith("o4")) &&
      !id.includes("instruct") &&
      !id.includes("realtime") &&
      !id.includes("audio")
    ) {
      text.push({
        value: model.id,
        label: model.id,
        provider: "OpenAI",
        apiProvider: "OPENAI",
        kind: "text",
      });
    }
  }

  text.sort((a, b) => a.label.localeCompare(b.label));
  image.sort((a, b) => a.label.localeCompare(b.label));

  return { text, image };
}

export async function listAnthropicModels(
  apiKey: string,
): Promise<{ text: LiveModelOption[]; image: LiveModelOption[] }> {
  const response = await fetch("https://api.anthropic.com/v1/models", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Anthropic listModels failed (${response.status}): ${error}`,
    );
  }

  const data = (await response.json()) as {
    data?: Array<{ id: string; display_name?: string }>;
  };

  const text = (data.data ?? []).map((model) => ({
    value: model.id,
    label: model.display_name ?? model.id,
    provider: "Anthropic" as const,
    apiProvider: "ANTHROPIC" as const,
    kind: "text" as const,
  }));

  text.sort((a, b) => a.label.localeCompare(b.label));

  return { text, image: [] };
}

async function listProviderModels(
  provider: AiProvider,
  apiKey: string,
): Promise<{ text: LiveModelOption[]; image: LiveModelOption[] }> {
  switch (provider) {
    case "GOOGLE":
      return listGoogleModels(apiKey);
    case "OPENAI":
      return listOpenAIModels(apiKey);
    case "ANTHROPIC":
      return listAnthropicModels(apiKey);
  }
}

export function invalidateModelCatalogCache(userId: string) {
  for (const key of catalogCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      catalogCache.delete(key);
    }
  }
}

export async function fetchLiveModelCatalogForUser(
  userId: string,
  providerKeys: Partial<Record<AiProvider, string>>,
  options: { refresh?: boolean } = {},
): Promise<{ textModels: LiveModelOption[]; imageModels: LiveModelOption[] }> {
  const cacheKey = `${userId}:catalog`;

  if (!options.refresh) {
    const cached = catalogCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.catalog;
    }
  }

  const textModels: LiveModelOption[] = [];
  const imageModels: LiveModelOption[] = [];
  const seenText = new Set<string>();
  const seenImage = new Set<string>();

  const providers: AiProvider[] = ["GOOGLE", "OPENAI", "ANTHROPIC"];

  await Promise.all(
    providers.map(async (provider) => {
      const apiKey = providerKeys[provider];
      if (!apiKey) {
        return;
      }

      try {
        const listed = await listProviderModels(provider, apiKey);

        for (const model of listed.text) {
          if (!seenText.has(model.value)) {
            seenText.add(model.value);
            textModels.push(model);
          }
        }

        for (const model of listed.image) {
          if (!seenImage.has(model.value)) {
            seenImage.add(model.value);
            imageModels.push(model);
          }
        }
      } catch (error) {
        console.error(`[list-models] Failed to list ${provider} models`, error);
      }
    }),
  );

  textModels.sort((a, b) => a.label.localeCompare(b.label));
  imageModels.sort((a, b) => a.label.localeCompare(b.label));

  const catalog = { textModels, imageModels };

  catalogCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    catalog,
  });

  return catalog;
}

export async function getProviderKeysForUser(
  userId: string,
): Promise<Partial<Record<AiProvider, string>>> {
  const { decryptApiKey } = await import("@/lib/encryption");
  const { prisma } = await import("@/lib/prisma");

  const records = await prisma.apiKey.findMany({
    where: { userId },
  });

  const keys: Partial<Record<AiProvider, string>> = {};

  for (const record of records) {
    keys[record.provider] = decryptApiKey(record.encryptedKey);
  }

  return keys;
}

export function modelBelongsToConfiguredProvider(
  modelId: string,
  configuredProviders: AiProvider[],
): boolean {
  return configuredProviders.includes(resolveModelProvider(modelId));
}

export { providerDisplayName };
