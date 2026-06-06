import type { AiImageModel, AiModel } from "@prisma/client";
import {
  buildBlendedPrompt,
  buildGenerationPrompt,
  parseModelJsonResponse,
} from "@/lib/ai/prompts";
import { getProviderApiKey, MissingApiKeyError } from "@/lib/ai/get-api-key";
import { getImageModelConfig, getModelConfig } from "@/lib/ai/models";
import {
  callAnthropic,
  callDalle,
  callGemini,
  callImagen,
  callOpenAI,
} from "@/lib/ai/providers";
import type { GenerationInput, GenerationOutputs } from "@/types";

export { MissingApiKeyError };

async function callTextModel(
  model: AiModel,
  messages: { system: string; user: string },
): Promise<string> {
  const config = getModelConfig(model);
  const apiKey = await getProviderApiKey(config.apiProvider);

  switch (config.apiProvider) {
    case "OPENAI":
      return callOpenAI(apiKey, config.apiModelId, messages);
    case "ANTHROPIC":
      return callAnthropic(apiKey, config.apiModelId, messages);
    case "GOOGLE":
      return callGemini(apiKey, config.apiModelId, messages);
    default:
      throw new Error(`Unsupported text provider: ${config.apiProvider}`);
  }
}

async function callImageModel(
  imageModel: AiImageModel,
  prompt: string,
): Promise<{ imageUrl: string; promptUsed: string; imageModel: AiImageModel }> {
  const config = getImageModelConfig(imageModel);
  const apiKey = await getProviderApiKey(config.apiProvider);

  let imageUrl: string;

  switch (config.apiProvider) {
    case "OPENAI": {
      const result = await callDalle(apiKey, config.apiModelId, prompt);
      imageUrl = result.imageUrl;
      break;
    }
    case "GOOGLE": {
      const result = await callImagen(apiKey, config.apiModelId, prompt);
      imageUrl = result.imageUrl;
      break;
    }
    default:
      throw new Error(`Unsupported image provider: ${config.apiProvider}`);
  }

  return {
    imageUrl,
    promptUsed: prompt,
    imageModel,
  };
}

export async function generateContent(
  input: GenerationInput,
  model: AiModel,
): Promise<GenerationOutputs> {
  return generateContentWithVisuals(input, model);
}

export async function generateContentWithVisuals(
  input: GenerationInput,
  textModel: AiModel,
  imageModel?: AiImageModel,
): Promise<GenerationOutputs> {
  const blendedPrompt = buildBlendedPrompt(input);
  const includeVisualPrompt = Boolean(imageModel);
  const messages = buildGenerationPrompt(
    input,
    blendedPrompt,
    includeVisualPrompt,
  );

  const rawResponse = await callTextModel(textModel, messages);
  const parsed = parseModelJsonResponse(rawResponse);

  const baseOutput: GenerationOutputs = {
    platforms: parsed.platforms,
    blendedPrompt,
    modelUsed: textModel,
    generatedAt: new Date().toISOString(),
    visualImagePrompt: parsed.visualImagePrompt,
  };

  if (!imageModel) {
    return baseOutput;
  }

  const imagePrompt =
    parsed.visualImagePrompt?.trim() ||
    buildFallbackImagePrompt(input, blendedPrompt);

  const visuals = await callImageModel(imageModel, imagePrompt);

  return {
    ...baseOutput,
    visualImagePrompt: imagePrompt,
    visuals,
  };
}

function buildFallbackImagePrompt(
  input: GenerationInput,
  blendedPrompt: string,
): string {
  const idea = input.idea?.trim();
  if (idea) {
    return `Create a polished social media graphic illustrating: ${idea}. Modern, eye-catching composition with balanced lighting and vivid colors.`;
  }

  return `Create a polished social media graphic based on this brief: ${blendedPrompt}. Modern, eye-catching composition with balanced lighting and vivid colors.`;
}
