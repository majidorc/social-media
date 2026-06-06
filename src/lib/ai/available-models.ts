import type { AiProvider } from "@prisma/client";
import {
  fetchLiveModelCatalogForUser,
  getProviderKeysForUser,
  invalidateModelCatalogCache,
  modelBelongsToConfiguredProvider,
} from "@/lib/ai/list-models";
import type { LiveModelCatalog, LiveModelOption } from "@/lib/ai/model-types";
import {
  findModelOption,
  normalizeModelId,
} from "@/lib/ai/models";
import type { ApiKeyStatus } from "@/types";

export { invalidateModelCatalogCache };

export function getConfiguredProviders(
  apiKeys: ApiKeyStatus[],
): AiProvider[] {
  return apiKeys.filter((item) => item.configured).map((item) => item.provider);
}

export async function getLiveModelCatalog(
  userId: string,
  apiKeys: ApiKeyStatus[],
  options: { refresh?: boolean } = {},
): Promise<LiveModelCatalog> {
  const providerKeys = await getProviderKeysForUser(userId);
  const catalog = await fetchLiveModelCatalogForUser(userId, providerKeys, options);

  return {
    ...catalog,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getAvailableModels(
  userId: string,
  apiKeys: ApiKeyStatus[],
  options?: { refresh?: boolean },
): Promise<LiveModelOption[]> {
  const catalog = await getLiveModelCatalog(userId, apiKeys, options);
  return catalog.textModels;
}

export async function getAvailableImageModels(
  userId: string,
  apiKeys: ApiKeyStatus[],
  options?: { refresh?: boolean },
): Promise<LiveModelOption[]> {
  const catalog = await getLiveModelCatalog(userId, apiKeys, options);
  return catalog.imageModels;
}

export async function getAvailableModelOptions(
  userId: string,
  apiKeys: ApiKeyStatus[],
  options?: { refresh?: boolean },
): Promise<LiveModelOption[]> {
  return getAvailableModels(userId, apiKeys, options);
}

export async function getAvailableImageModelOptions(
  userId: string,
  apiKeys: ApiKeyStatus[],
  options?: { refresh?: boolean },
): Promise<LiveModelOption[]> {
  return getAvailableImageModels(userId, apiKeys, options);
}

export function resolveDefaultModel(
  storedModel: string,
  availableModels: LiveModelOption[],
): string | null {
  if (availableModels.length === 0) {
    return null;
  }

  const normalizedStored = normalizeModelId(storedModel);

  const match = availableModels.find(
    (model) => normalizeModelId(model.value) === normalizedStored,
  );

  if (match) {
    return match.value;
  }

  return availableModels[0]?.value ?? null;
}

export async function isModelAvailable(
  userId: string,
  modelId: string,
  apiKeys: ApiKeyStatus[],
  options?: { refresh?: boolean },
): Promise<boolean> {
  const configured = getConfiguredProviders(apiKeys);

  if (!modelBelongsToConfiguredProvider(modelId, configured)) {
    return false;
  }

  const catalog = await getLiveModelCatalog(userId, apiKeys, options);
  return Boolean(findModelOption(catalog.textModels, modelId));
}

export async function isImageModelAvailable(
  userId: string,
  modelId: string,
  apiKeys: ApiKeyStatus[],
  options?: { refresh?: boolean },
): Promise<boolean> {
  const configured = getConfiguredProviders(apiKeys);

  if (!modelBelongsToConfiguredProvider(modelId, configured)) {
    return false;
  }

  const catalog = await getLiveModelCatalog(userId, apiKeys, options);
  return Boolean(findModelOption(catalog.imageModels, modelId));
}
