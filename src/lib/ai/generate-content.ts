import {
  accumulateGenerationUsage,
  buildGenerationUsage,
} from "@/lib/ai/cost-calculator";
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
import type { TextModelResult } from "@/lib/ai/providers";
import {
  callAnthropic,
  callDalle,
  callGemini,
  callImagen,
  callOpenAI,
  callVideoOrTtsAPI,
} from "@/lib/ai/providers";
import { applyWatermarkIfConfigured } from "@/lib/image/watermark";
import type { BrandProfileContext } from "@/lib/brand-profile";
import type { GenerationInput, GenerationOutputs } from "@/types";
import type { WatermarkPosition } from "@prisma/client";

export { MissingApiKeyError };

async function callTextModel(
  modelId: string,
  messages: { system: string; user: string },
): Promise<TextModelResult> {
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
  watermarkLogoUrl?: string | null,
  watermarkPosition?: WatermarkPosition | null,
  brandProfile?: BrandProfileContext | null,
): Promise<GenerationOutputs> {
  const blendedPrompt = buildBlendedPrompt(input);
  const includeVisualPrompt = Boolean(imageModel);
  const includeVideoMetadata = Boolean(input.enableVideo);
  const messages = buildGenerationPrompt(input, blendedPrompt, {
    includeVisualPrompt,
    includeVideoMetadata,
    brandProfile,
  });

  const textResult = await callTextModel(textModel, messages);
  const parsed = parseModelJsonResponse(textResult.content);

  let imageCount = 0;

  const baseOutput: GenerationOutputs = {
    platforms: parsed.platforms,
    blendedPrompt,
    modelUsed: normalizeModelId(textModel),
    generatedAt: new Date().toISOString(),
    visualImagePrompt: parsed.visualImagePrompt,
  };

  let result: GenerationOutputs = { ...baseOutput };

  if (imageModel) {
    const imagePrompt =
      parsed.visualImagePrompt?.trim() ||
      buildFallbackImagePrompt(input, blendedPrompt);

    const visuals = await callImageModel(imageModel, imagePrompt);
    imageCount = 1;
    const watermarkedImageUrl = await applyWatermarkIfConfigured(
      visuals.imageUrl,
      watermarkLogoUrl,
      { position: watermarkPosition },
    );

    result = {
      ...result,
      visualImagePrompt: imagePrompt,
      visuals: {
        ...visuals,
        imageUrl: watermarkedImageUrl,
      },
    };
  }

  if (input.enableVideo) {
    const videoMetadata = parsed.videoMetadata;

    if (!videoMetadata?.voiceoverText) {
      throw new Error(
        "Video generation was enabled, but the model did not return video_metadata.",
      );
    }

    const videoAsset = await callVideoOrTtsAPI(
      videoMetadata.voiceoverText,
      result.visualImagePrompt ?? blendedPrompt,
    );

    result = {
      ...result,
      video: {
        url: videoAsset.videoUrl,
        script: videoMetadata.videoScript,
        voiceoverCopy: videoMetadata.voiceoverText,
      },
    };
  }

  result = {
    ...result,
    usage: buildGenerationUsage({
      textModelId: textModel,
      promptTokens: textResult.usage.promptTokens,
      completionTokens: textResult.usage.completionTokens,
      imageModelId: imageModel,
      imageCount,
    }),
  };

  return result;
}

export async function regenerateTextOnly(
  input: GenerationInput,
  textModel: string,
  previous: GenerationOutputs,
  brandProfile?: BrandProfileContext | null,
): Promise<GenerationOutputs> {
  const blendedPrompt = buildBlendedPrompt(input);
  const includeVisualPrompt = Boolean(
    input.imageModel || previous.visuals || previous.visualImagePrompt,
  );
  const includeVideoMetadata = Boolean(input.enableVideo || previous.video);
  const messages = buildGenerationPrompt(input, blendedPrompt, {
    includeVisualPrompt,
    includeVideoMetadata,
    brandProfile,
  });

  const textResult = await callTextModel(textModel, messages);
  const parsed = parseModelJsonResponse(textResult.content);

  let result: GenerationOutputs = {
    platforms: parsed.platforms,
    blendedPrompt,
    modelUsed: normalizeModelId(textModel),
    generatedAt: new Date().toISOString(),
    visualImagePrompt:
      parsed.visualImagePrompt?.trim() || previous.visualImagePrompt,
    visuals: previous.visuals,
    video: previous.video,
  };

  if (input.enableVideo && parsed.videoMetadata?.voiceoverText) {
    result = {
      ...result,
      video: {
        url: previous.video?.url ?? "",
        script: parsed.videoMetadata.videoScript,
        voiceoverCopy: parsed.videoMetadata.voiceoverText,
      },
    };
  }

  const textIncrement = buildGenerationUsage({
    textModelId: textModel,
    promptTokens: textResult.usage.promptTokens,
    completionTokens: textResult.usage.completionTokens,
    imageCount: 0,
  });

  result = {
    ...result,
    usage: accumulateGenerationUsage(previous.usage, textIncrement),
  };

  return result;
}

export async function regenerateImageOnly(
  input: GenerationInput,
  imageModel: string,
  previous: GenerationOutputs,
  watermarkLogoUrl?: string | null,
  watermarkPosition?: WatermarkPosition | null,
): Promise<GenerationOutputs> {
  const imagePrompt =
    previous.visuals?.promptUsed?.trim() ||
    previous.visualImagePrompt?.trim() ||
    buildFallbackImagePrompt(input, previous.blendedPrompt);

  const visuals = await callImageModel(imageModel, imagePrompt);
  const watermarkedImageUrl = await applyWatermarkIfConfigured(
    visuals.imageUrl,
    watermarkLogoUrl,
    { position: watermarkPosition },
  );

  const imageIncrement = buildGenerationUsage({
    textModelId: previous.modelUsed,
    promptTokens: 0,
    completionTokens: 0,
    imageModelId: imageModel,
    imageCount: 1,
  });

  return {
    ...previous,
    visualImagePrompt: imagePrompt,
    generatedAt: new Date().toISOString(),
    visuals: {
      ...visuals,
      imageUrl: watermarkedImageUrl,
    },
    usage: accumulateGenerationUsage(previous.usage, imageIncrement),
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
