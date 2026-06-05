import type { AiModel, AiProvider } from "@prisma/client";
import { z } from "zod";

export const AI_MODEL_CONFIG: Record<
  AiModel,
  {
    label: string;
    provider: "OpenAI" | "Anthropic" | "Google";
    apiProvider: AiProvider;
    /** Provider-native model ID sent to the API */
    apiModelId: string;
  }
> = {
  GPT_4O: {
    label: "GPT-4o",
    provider: "OpenAI",
    apiProvider: "OPENAI",
    apiModelId: "gpt-4o",
  },
  GPT_4O_MINI: {
    label: "GPT-4o Mini",
    provider: "OpenAI",
    apiProvider: "OPENAI",
    apiModelId: "gpt-4o-mini",
  },
  CLAUDE_35_SONNET: {
    label: "Claude Sonnet 4",
    provider: "Anthropic",
    apiProvider: "ANTHROPIC",
    apiModelId: "claude-sonnet-4-20250514",
  },
  GEMINI_25_PRO: {
    label: "Gemini 2.5 Pro",
    provider: "Google",
    apiProvider: "GOOGLE",
    apiModelId: "gemini-2.5-pro",
  },
  GEMINI_25_FLASH: {
    label: "Gemini 2.5 Flash",
    provider: "Google",
    apiProvider: "GOOGLE",
    apiModelId: "gemini-2.5-flash",
  },
};

export const AI_MODEL_VALUES = Object.keys(AI_MODEL_CONFIG) as AiModel[];

export const aiModelSchema = z.enum([
  "GPT_4O",
  "GPT_4O_MINI",
  "CLAUDE_35_SONNET",
  "GEMINI_25_PRO",
  "GEMINI_25_FLASH",
]);

export function getModelConfig(model: AiModel) {
  return AI_MODEL_CONFIG[model];
}
