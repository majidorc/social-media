import type { AiModel } from "@prisma/client";
import {
  buildBlendedPrompt,
  buildGenerationPrompt,
  parseModelJsonResponse,
} from "@/lib/ai/prompts";
import { getProviderApiKey, MissingApiKeyError } from "@/lib/ai/get-api-key";
import { getModelConfig } from "@/lib/ai/models";
import { callAnthropic, callGemini, callOpenAI } from "@/lib/ai/providers";
import type { GenerationInput, GenerationOutputs } from "@/types";

export { MissingApiKeyError };

export async function generateContent(
  input: GenerationInput,
  model: AiModel,
): Promise<GenerationOutputs> {
  const config = getModelConfig(model);
  const apiKey = await getProviderApiKey(config.apiProvider);
  const blendedPrompt = buildBlendedPrompt(input);
  const messages = buildGenerationPrompt(input, blendedPrompt);

  let rawResponse: string;

  switch (config.apiProvider) {
    case "OPENAI":
      rawResponse = await callOpenAI(apiKey, config.apiModelId, messages);
      break;
    case "ANTHROPIC":
      rawResponse = await callAnthropic(apiKey, config.apiModelId, messages);
      break;
    case "GOOGLE":
      rawResponse = await callGemini(apiKey, config.apiModelId, messages);
      break;
    default:
      throw new Error(`Unsupported provider: ${config.apiProvider}`);
  }

  const parsed = parseModelJsonResponse(rawResponse);

  return {
    platforms: parsed.platforms,
    blendedPrompt,
    modelUsed: model,
    generatedAt: new Date().toISOString(),
  };
}
