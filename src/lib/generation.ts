import type { AiModel, Platform } from "@prisma/client";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import type { GenerationInput, GenerationOutputs, PlatformOutput } from "@/types";

const PLATFORM_LABELS: Record<Platform, string> = Object.fromEntries(
  PLATFORM_OPTIONS.map((option) => [option.value, option.label]),
) as Record<Platform, string>;

function buildBlendedPrompt(input: GenerationInput): string {
  const sections: string[] = [];

  if (input.idea?.trim()) {
    sections.push(`Core idea: ${input.idea.trim()}`);
  }

  if (input.imageUrls?.length) {
    sections.push(`Reference images: ${input.imageUrls.join(", ")}`);
  }

  if (input.linkUrl?.trim()) {
    sections.push(`Source link: ${input.linkUrl.trim()}`);
  }

  if (input.videoUrls?.length) {
    sections.push(`Reference videos: ${input.videoUrls.join(", ")}`);
  }

  if (sections.length === 0) {
    return "Generate versatile social content from minimal context.";
  }

  return sections.join("\n");
}

function generatePlatformContent(
  platform: Platform,
  blendedPrompt: string,
  model: AiModel,
): PlatformOutput {
  const label = PLATFORM_LABELS[platform];
  const option = PLATFORM_OPTIONS.find((item) => item.value === platform);
  const ideaSnippet = blendedPrompt.split("\n")[0]?.slice(0, 120) ?? blendedPrompt;

  const baseContent = `[Mock ${model} output for ${label}]\n\n${ideaSnippet}`;

  switch (platform) {
    case "TWITTER":
      return {
        platform,
        content: baseContent.slice(0, option?.characterLimit ?? 280),
        metadata: { characterCount: Math.min(baseContent.length, 280) },
      };
    case "INSTAGRAM":
      return {
        platform,
        content: `${baseContent}\n\nHook: Stop scrolling — here's what matters.\nCapCut script: Open with a bold text overlay, cut to B-roll at 0:03.`,
        metadata: { hook: "Stop scrolling — here's what matters." },
      };
    case "LINKEDIN":
      return {
        platform,
        content: `${baseContent}\n\nProfessional takeaway: Share one actionable insight your network can apply today.`,
        metadata: { tone: "professional" },
      };
    default:
      return {
        platform,
        content: `${baseContent}\n\nTailored for ${label} with platform-specific formatting.`,
      };
  }
}

export function mockGenerateContent(
  input: GenerationInput,
  model: AiModel,
): GenerationOutputs {
  const blendedPrompt = buildBlendedPrompt(input);

  const platforms: PlatformOutput[] = input.platforms.map((platform) =>
    generatePlatformContent(platform, blendedPrompt, model),
  );

  return {
    platforms,
    blendedPrompt,
    modelUsed: model,
    generatedAt: new Date().toISOString(),
  };
}
