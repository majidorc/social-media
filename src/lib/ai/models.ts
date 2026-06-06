import type { AiProvider } from "@prisma/client";
import { z } from "zod";
import type { LiveModelOption } from "@/lib/ai/model-types";

export function normalizeModelId(modelId: string): string {
  return modelId.replace(/^models\//, "").trim();
}

export function resolveModelProvider(modelId: string): AiProvider {
  const id = normalizeModelId(modelId).toLowerCase();

  if (
    id.startsWith("gpt-") ||
    id.startsWith("dall-e") ||
    id.startsWith("o1") ||
    id.startsWith("o3") ||
    id.startsWith("o4") ||
    id.includes("gpt-image")
  ) {
    return "OPENAI";
  }

  if (id.startsWith("claude")) {
    return "ANTHROPIC";
  }

  return "GOOGLE";
}

export function providerDisplayName(
  provider: AiProvider,
): LiveModelOption["provider"] {
  switch (provider) {
    case "OPENAI":
      return "OpenAI";
    case "ANTHROPIC":
      return "Anthropic";
    case "GOOGLE":
      return "Google";
  }
}

export function isImageModelId(modelId: string): boolean {
  const id = normalizeModelId(modelId).toLowerCase();
  return (
    id.includes("imagen") ||
    id.startsWith("dall-e") ||
    id.includes("gpt-image")
  );
}

export const modelIdSchema = z
  .string()
  .trim()
  .min(1, "Model id is required")
  .max(128);

export const textModelSchema = modelIdSchema;
export const imageModelSchema = modelIdSchema;

export function findModelOption(
  catalog: LiveModelOption[],
  modelId: string,
): LiveModelOption | undefined {
  const normalized = normalizeModelId(modelId);
  return catalog.find((item) => normalizeModelId(item.value) === normalized);
}

export function formatModelLabel(option: LiveModelOption): string {
  return `${option.label} · ${option.provider}`;
}
