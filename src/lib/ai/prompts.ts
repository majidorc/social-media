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

  const system = `You are an expert social media content strategist. Generate platform-specific content based on the user's inputs.

Rules:
- Return ONLY valid JSON, no markdown fences.
- Each platform gets unique, tailored copy (not copy-paste).
- Twitter/X must respect character limits.
- Instagram should include a hook and optional CapCut/video script notes.
- LinkedIn should use a professional, thought-leadership tone.

JSON shape:
{
  "platforms": [
    {
      "platform": "INSTAGRAM",
      "content": "full post text",
      "metadata": { "hook": "optional hook" }
    }
  ]
}

Platform keys must be exactly: ${input.platforms.join(", ")}.`;

  const user = `Inputs:
${blendedPrompt}

Platforms to generate:
${platformInstructions}

Generate one entry per platform in the JSON response.`;

  return { system, user };
}

export function parseModelJsonResponse(raw: string): {
  platforms: Array<{
    platform: Platform;
    content: string;
    metadata?: Record<string, string | number | boolean>;
  }>;
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
  };

  if (!parsed.platforms?.length) {
    throw new Error("Model response did not include platform outputs.");
  }

  return { platforms: parsed.platforms };
}
