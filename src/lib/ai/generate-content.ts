import {
  buildBlendedPrompt,
  buildGenerationPrompt,
  parseModelJsonResponse,
} from "@/lib/ai/prompts";
import { getProviderApiKey, MissingApiKeyError } from "@/lib/ai/get-api-key";
import {
  normalizeModelId,
  resolveModelProvider,
} from "@/lib/ai/models";
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
  modelId: string,
  messages: { system: string; user: string },
): Promise<string> {
  const provider = resolveModelProvider(modelId);
  const apiKey = await getProviderApiKey(provider);
  const normalizedId = normalizeModelId(modelId);

  switch (provider) {
    case "OPENAI":
      return callOpenAI(apiKey, normalizedId, messages);
    case "ANTHROPIC":
      return callAnthropic(apiKey, normalizedId, messages);
    case "GOOGLE":
      return callGemini(apiKey, normalizedId, messages);
    default:
      throw new Error(`Unsupported text provider: ${provider}`);
  }
}

async function callImageModel(
  modelId: string,
  prompt: string,
): Promise<{ imageUrl: string; promptUsed: string; imageModel: string }> {
  const provider = resolveModelProvider(modelId);
  const apiKey = await getProviderApiKey(provider);
  const normalizedId = normalizeModelId(modelId);

  let imageUrl: string;

  switch (provider) {
    case "OPENAI": {
      const result = await callDalle(apiKey, normalizedId, prompt);
      imageUrl = result.imageUrl;
      break;
    }
    case "GOOGLE": {
      const result = await callImagen(apiKey, normalizedId, prompt);
      imageUrl = result.imageUrl;
      break;
    }
    default:
      throw new Error(`Unsupported image provider: ${provider}`);
  }

  return {
    imageUrl,
    promptUsed: prompt,
    imageModel: normalizedId,
  };
}

export async function generateContent(
  input: GenerationInput,
  model: string,
): Promise<GenerationOutputs> {
  return generateContentWithVisuals(input, model);
}

export async function generateContentWithVisuals(
  input: GenerationInput,
  textModel: string,
  imageModel?: string,
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
    modelUsed: normalizeModelId(textModel),
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
