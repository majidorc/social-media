import { normalizeModelId } from "@/lib/ai/models";
import type { GenerationUsage } from "@/types";

const MILLION = 1_000_000;
const DEFAULT_IMAGE_COST_USD = 0.04;

interface TextModelRates {
  inputPerMillion: number;
  outputPerMillion: number;
}

function resolveTextModelRates(modelId: string): TextModelRates {
  const id = normalizeModelId(modelId).toLowerCase();

  if (id.includes("claude") && (id.includes("3-5-sonnet") || id.includes("3.5-sonnet"))) {
    return { inputPerMillion: 3, outputPerMillion: 15 };
  }

  if (id.includes("gemini") && id.includes("pro")) {
    return { inputPerMillion: 1.25, outputPerMillion: 5 };
  }

  if (id.includes("gemini") && id.includes("flash")) {
    return { inputPerMillion: 0.075, outputPerMillion: 0.3 };
  }

  if (id.includes("gpt-4o")) {
    return { inputPerMillion: 5, outputPerMillion: 15 };
  }

  if (id.startsWith("gpt-") || id.startsWith("o1") || id.startsWith("o3") || id.startsWith("o4")) {
    return { inputPerMillion: 5, outputPerMillion: 15 };
  }

  if (id.includes("claude")) {
    return { inputPerMillion: 3, outputPerMillion: 15 };
  }

  if (id.includes("gemini")) {
    return { inputPerMillion: 0.075, outputPerMillion: 0.3 };
  }

  return { inputPerMillion: 1, outputPerMillion: 3 };
}

function isBillableImageModel(modelId: string): boolean {
  const id = normalizeModelId(modelId).toLowerCase();
  return (
    id.startsWith("dall-e") ||
    id.includes("gpt-image") ||
    id.includes("imagen")
  );
}

export function calculateTextModelCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const rates = resolveTextModelRates(modelId);
  const inputCost = (promptTokens / MILLION) * rates.inputPerMillion;
  const outputCost = (completionTokens / MILLION) * rates.outputPerMillion;
  return inputCost + outputCost;
}

export function calculateImageModelCost(
  modelId: string,
  imageCount: number,
): number {
  if (imageCount <= 0 || !isBillableImageModel(modelId)) {
    return 0;
  }

  return imageCount * DEFAULT_IMAGE_COST_USD;
}

export function buildGenerationUsage(input: {
  textModelId: string;
  promptTokens: number;
  completionTokens: number;
  imageModelId?: string | null;
  imageCount?: number;
}): GenerationUsage {
  const promptTokens = Math.max(0, Math.round(input.promptTokens));
  const completionTokens = Math.max(0, Math.round(input.completionTokens));
  const imageCount = Math.max(0, Math.round(input.imageCount ?? 0));

  const textCost = calculateTextModelCost(
    input.textModelId,
    promptTokens,
    completionTokens,
  );
  const imageCost = input.imageModelId
    ? calculateImageModelCost(input.imageModelId, imageCount)
    : 0;

  const totalCost = textCost + imageCost;

  return {
    promptTokens,
    completionTokens,
    imageCount,
    totalCost: Number(totalCost.toFixed(6)),
  };
}

/** Add a regen step's usage onto the workspace running total. */
export function accumulateGenerationUsage(
  previous: GenerationUsage | undefined,
  increment: GenerationUsage,
): GenerationUsage {
  return {
    promptTokens: (previous?.promptTokens ?? 0) + increment.promptTokens,
    completionTokens:
      (previous?.completionTokens ?? 0) + increment.completionTokens,
    imageCount: (previous?.imageCount ?? 0) + increment.imageCount,
    totalCost: Number(
      ((previous?.totalCost ?? 0) + increment.totalCost).toFixed(6),
    ),
  };
}

export function formatUsageCost(totalCost: number): string {
  if (totalCost < 0.01) {
    return `$${totalCost.toFixed(4)}`;
  }

  if (totalCost < 1) {
    return `$${totalCost.toFixed(3)}`;
  }

  return `$${totalCost.toFixed(2)}`;
}

export function formatTokenCount(count: number): string {
  return count.toLocaleString();
}

export function getTotalTokenCount(usage: GenerationUsage): number {
  return usage.promptTokens + usage.completionTokens;
}
