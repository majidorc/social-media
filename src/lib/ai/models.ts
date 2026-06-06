import type { AiImageModel, AiModel, AiProvider } from "@prisma/client";
import { z } from "zod";

export type ModelKind = "text" | "image";

interface BaseModelConfig {
  label: string;
  provider: "OpenAI" | "Anthropic" | "Google";
  apiProvider: AiProvider;
  apiModelId: string;
  kind: ModelKind;
}

export const AI_MODEL_CONFIG: Record<AiModel, BaseModelConfig & { kind: "text" }> =
  {
    GPT_4O: {
      label: "GPT-4o",
      provider: "OpenAI",
      apiProvider: "OPENAI",
      apiModelId: "gpt-4o",
      kind: "text",
    },
    GPT_4O_MINI: {
      label: "GPT-4o Mini",
      provider: "OpenAI",
      apiProvider: "OPENAI",
      apiModelId: "gpt-4o-mini",
      kind: "text",
    },
    CLAUDE_35_SONNET: {
      label: "Claude Sonnet 4",
      provider: "Anthropic",
      apiProvider: "ANTHROPIC",
      apiModelId: "claude-sonnet-4-20250514",
      kind: "text",
    },
    GEMINI_25_PRO: {
      label: "Gemini 2.5 Pro",
      provider: "Google",
      apiProvider: "GOOGLE",
      apiModelId: "gemini-2.5-pro",
      kind: "text",
    },
    GEMINI_25_FLASH: {
      label: "Gemini 2.5 Flash",
      provider: "Google",
      apiProvider: "GOOGLE",
      apiModelId: "gemini-2.5-flash",
      kind: "text",
    },
  };

export const AI_IMAGE_MODEL_CONFIG: Record<
  AiImageModel,
  BaseModelConfig & { kind: "image" }
> = {
  IMAGEN_3_PRO: {
    label: "Imagen 3 Pro",
    provider: "Google",
    apiProvider: "GOOGLE",
    apiModelId: "imagen-3.0-generate-002",
    kind: "image",
  },
  IMAGEN_3_FAST: {
    label: "Imagen 3 Fast",
    provider: "Google",
    apiProvider: "GOOGLE",
    apiModelId: "imagen-3.0-fast-generate-001",
    kind: "image",
  },
  DALL_E_3: {
    label: "DALL-E 3",
    provider: "OpenAI",
    apiProvider: "OPENAI",
    apiModelId: "dall-e-3",
    kind: "image",
  },
};

export const AI_MODEL_VALUES = Object.keys(AI_MODEL_CONFIG) as AiModel[];
export const AI_IMAGE_MODEL_VALUES = Object.keys(
  AI_IMAGE_MODEL_CONFIG,
) as AiImageModel[];

export const aiModelSchema = z.enum([
  "GPT_4O",
  "GPT_4O_MINI",
  "CLAUDE_35_SONNET",
  "GEMINI_25_PRO",
  "GEMINI_25_FLASH",
]);

export const aiImageModelSchema = z.enum([
  "IMAGEN_3_PRO",
  "IMAGEN_3_FAST",
  "DALL_E_3",
]);

export function getModelConfig(model: AiModel) {
  return AI_MODEL_CONFIG[model];
}

export function getImageModelConfig(model: AiImageModel) {
  return AI_IMAGE_MODEL_CONFIG[model];
}

export function isTextModel(model: AiModel): boolean {
  return AI_MODEL_CONFIG[model].kind === "text";
}

export function isImageModel(model: AiImageModel): boolean {
  return AI_IMAGE_MODEL_CONFIG[model].kind === "image";
}
