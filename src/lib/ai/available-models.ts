import type { AiImageModel, AiModel, AiProvider } from "@prisma/client";
import {
  AI_IMAGE_MODEL_CONFIG,
  AI_IMAGE_MODEL_VALUES,
  AI_MODEL_CONFIG,
  AI_MODEL_VALUES,
} from "@/lib/ai/models";
import { AI_IMAGE_MODEL_OPTIONS, AI_MODEL_OPTIONS } from "@/lib/constants";
import type { ApiKeyStatus } from "@/types";

export function getConfiguredProviders(
  apiKeys: ApiKeyStatus[],
): AiProvider[] {
  return apiKeys.filter((item) => item.configured).map((item) => item.provider);
}

export function getAvailableModels(apiKeys: ApiKeyStatus[]): AiModel[] {
  const configured = new Set(getConfiguredProviders(apiKeys));

  return AI_MODEL_VALUES.filter((model) =>
    configured.has(AI_MODEL_CONFIG[model].apiProvider),
  );
}

export function getAvailableImageModels(
  apiKeys: ApiKeyStatus[],
): AiImageModel[] {
  const configured = new Set(getConfiguredProviders(apiKeys));

  return AI_IMAGE_MODEL_VALUES.filter((model) =>
    configured.has(AI_IMAGE_MODEL_CONFIG[model].apiProvider),
  );
}

export function getAvailableModelOptions(apiKeys: ApiKeyStatus[]) {
  const available = new Set(getAvailableModels(apiKeys));

  return AI_MODEL_OPTIONS.filter((option) => available.has(option.value));
}

export function getAvailableImageModelOptions(apiKeys: ApiKeyStatus[]) {
  const available = new Set(getAvailableImageModels(apiKeys));

  return AI_IMAGE_MODEL_OPTIONS.filter((option) => available.has(option.value));
}

export function resolveDefaultModel(
  storedModel: AiModel,
  apiKeys: ApiKeyStatus[],
): AiModel | null {
  const available = getAvailableModels(apiKeys);

  if (available.length === 0) {
    return null;
  }

  if (available.includes(storedModel)) {
    return storedModel;
  }

  return available[0];
}

export function isModelAvailable(
  model: AiModel,
  apiKeys: ApiKeyStatus[],
): boolean {
  return getAvailableModels(apiKeys).includes(model);
}

export function isImageModelAvailable(
  model: AiImageModel,
  apiKeys: ApiKeyStatus[],
): boolean {
  return getAvailableImageModels(apiKeys).includes(model);
}
