import type { Platform } from "@prisma/client";
import { PLATFORM_OPTIONS } from "@/lib/constants";
import { buildBrandContextSystemRule, type BrandProfileContext } from "@/lib/brand-profile";
import type { GenerationInput } from "@/types";

export interface ParsedVideoMetadata {
  videoScript: string;
  voiceoverText: string;
}

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

function buildJsonShape(
  includeVisualPrompt: boolean,
  includeVideoMetadata: boolean,
): string {
  const fields: string[] = [
    `"platforms": [
    {
      "platform": "INSTAGRAM",
      "content": "full post text",
      "metadata": { "hook": "optional hook" }
    }
  ]`,
  ];

  if (includeVisualPrompt) {
    fields.push(
      `"visual_image_prompt": "detailed English prompt for image generation"`,
    );
  }

  if (includeVideoMetadata) {
    fields.push(`"video_metadata": {
    "video_script": "Scene 1 (0-3s): [TEXT OVERLAY: Hook] Visual description...\\nScene 2 (3-8s): ...",
    "voiceover_text": "Exact narration script for text-to-speech, conversational and concise."
  }`);
  }

  return `{\n  ${fields.join(",\n  ")}\n}`;
}

export function buildGenerationPrompt(
  input: GenerationInput,
  blendedPrompt: string,
  options: {
    includeVisualPrompt: boolean;
    includeVideoMetadata: boolean;
    brandProfile?: BrandProfileContext | null;
  },
): { system: string; user: string } {
  const { includeVisualPrompt, includeVideoMetadata, brandProfile } = options;

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

  const videoMetadataRule = includeVideoMetadata
    ? `
- Include "video_metadata" with:
  - "video_script": a scene-by-scene short-form video plan with explicit [TEXT OVERLAY: ...] markers for editors/CapCut.
  - "voiceover_text": the exact spoken narration for a text-to-speech model (no scene labels, ready to read aloud).
- Align the video script and voiceover with the same creative direction as the platform copy.`
    : "";

  const jsonShape = buildJsonShape(includeVisualPrompt, includeVideoMetadata);
  const brandContextRule = brandProfile
    ? buildBrandContextSystemRule(brandProfile)
    : "";

  const system = `You are an expert social media content strategist. Generate platform-specific content based on the user's inputs.

Rules:
- Return ONLY valid JSON, no markdown fences.
- Each platform gets unique, tailored copy (not copy-paste).
- Twitter/X must respect character limits.
- Instagram should include a hook and optional CapCut/video script notes.
- Instagram must use at most 5 hashtags total — never dump long hashtag lists.
- LinkedIn should use a professional, thought-leadership tone.${visualPromptRule}${videoMetadataRule}${brandContextRule}

JSON shape:
${jsonShape}

Platform keys must be exactly: ${input.platforms.join(", ")}.`;

  const extras: string[] = [];
  if (includeVisualPrompt) {
    extras.push("Also include visual_image_prompt for a companion social graphic.");
  }
  if (includeVideoMetadata) {
    extras.push("Also include video_metadata for short-form video production.");
  }

  const user = `Inputs:
${blendedPrompt}

Platforms to generate:
${platformInstructions}

Generate one entry per platform in the JSON response.${
    extras.length ? ` ${extras.join(" ")}` : ""
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
  videoMetadata?: ParsedVideoMetadata;
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
    video_metadata?: {
      video_script?: string;
      voiceover_text?: string;
    };
  };

  if (!parsed.platforms?.length) {
    throw new Error("Model response did not include platform outputs.");
  }

  const visualImagePrompt = parsed.visual_image_prompt?.trim();
  const videoScript = parsed.video_metadata?.video_script?.trim();
  const voiceoverText = parsed.video_metadata?.voiceover_text?.trim();

  return {
    platforms: parsed.platforms.map((item) =>
      item.platform === "INSTAGRAM"
        ? { ...item, content: limitInstagramHashtags(item.content) }
        : item,
    ),
    visualImagePrompt: visualImagePrompt || undefined,
    videoMetadata:
      videoScript && voiceoverText
        ? { videoScript, voiceoverText }
        : undefined,
  };
}

const INSTAGRAM_HASHTAG_LIMIT = 5;
const HASHTAG_PATTERN = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/gu;

/** Keep first N hashtags; strip the rest so captions stay tight. */
export function limitInstagramHashtags(
  content: string,
  max = INSTAGRAM_HASHTAG_LIMIT,
): string {
  let kept = 0;

  const trimmed = content.replace(HASHTAG_PATTERN, (match) => {
    kept += 1;
    return kept <= max ? match : "";
  });

  return trimmed
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}
