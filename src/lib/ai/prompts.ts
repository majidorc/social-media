import type { Platform } from "@prisma/client";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import type { GenerationInput } from "@/types";

export function buildBlendedPrompt(input: GenerationInput): string {
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

export function buildGenerationPrompt(
  input: GenerationInput,
  blendedPrompt: string,
  includeVisualPrompt: boolean,
): { system: string; user: string } {
  const platformInstructions = input.platforms
    .map((platform) => {
      const option = PLATFORM_OPTIONS.find((item) => item.value === platform);
      const limit = option?.characterLimit
        ? ` Max ${option.characterLimit} characters.`
        : "";
      return `- ${option?.label ?? platform}: ${option?.description ?? "Tailored post"}.${limit}`;
    })
    .join("\n");

  const visualPromptRule = includeVisualPrompt
    ? `
- Include "visual_image_prompt": a single highly descriptive English prompt for an AI image generator.
- The image prompt must match the theme, tone, and subject of the generated copy.
- Describe composition, lighting, style, colors, and mood. No markdown, no quotes wrapping the whole prompt.
- Do not reference social media UI or text overlays in the image prompt unless essential to the concept.`
    : "";

  const jsonShape = includeVisualPrompt
    ? `{
  "platforms": [
    {
      "platform": "INSTAGRAM",
      "content": "full post text",
      "metadata": { "hook": "optional hook" }
    }
  ],
  "visual_image_prompt": "detailed English prompt for image generation"
}`
    : `{
  "platforms": [
    {
      "platform": "INSTAGRAM",
      "content": "full post text",
      "metadata": { "hook": "optional hook" }
    }
  ]
}`;

  const system = `You are an expert social media content strategist. Generate platform-specific content based on the user's inputs.

Rules:
- Return ONLY valid JSON, no markdown fences.
- Each platform gets unique, tailored copy (not copy-paste).
- Twitter/X must respect character limits.
- Instagram should include a hook and optional CapCut/video script notes.
- LinkedIn should use a professional, thought-leadership tone.${visualPromptRule}

JSON shape:
${jsonShape}

Platform keys must be exactly: ${input.platforms.join(", ")}.`;

  const user = `Inputs:
${blendedPrompt}

Platforms to generate:
${platformInstructions}

Generate one entry per platform in the JSON response.${
    includeVisualPrompt
      ? " Also include visual_image_prompt for a companion social graphic."
      : ""
  }`;

  return { system, user };
}

export function parseModelJsonResponse(raw: string): {
  platforms: Array<{
    platform: Platform;
    content: string;
    metadata?: Record<string, string | number | boolean>;
  }>;
  visualImagePrompt?: string;
} {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    : trimmed;

  const parsed = JSON.parse(jsonText) as {
    platforms?: Array<{
      platform: Platform;
      content: string;
      metadata?: Record<string, string | number | boolean>;
    }>;
    visual_image_prompt?: string;
  };

  if (!parsed.platforms?.length) {
    throw new Error("Model response did not include platform outputs.");
  }

  const visualImagePrompt = parsed.visual_image_prompt?.trim();

  return {
    platforms: parsed.platforms,
    visualImagePrompt: visualImagePrompt || undefined,
  };
}
