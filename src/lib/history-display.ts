import type { Prisma } from "@prisma/client";
import { parseGenerationOutputs } from "@/lib/workspace-history";

export const HISTORY_TITLE_FALLBACK = "Untitled Generation";

const HISTORY_TITLE_MAX_LENGTH = 42;
const CAPTION_PREVIEW_LENGTH = 25;

const GENERIC_IDEA_PATTERNS = [
  /^generate versatile social content from minimal context\.?$/i,
  /^minimal context$/i,
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isGenericIdea(idea: string): boolean {
  return GENERIC_IDEA_PATTERNS.some((pattern) => pattern.test(idea));
}

function appendEllipsis(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

export function truncateHistoryTitle(title: string, max = HISTORY_TITLE_MAX_LENGTH): string {
  if (title.length <= max) {
    return title;
  }

  return `${title.slice(0, max - 1).trimEnd()}…`;
}

export function extractCaptionPreview(outputs: Prisma.JsonValue): string | null {
  try {
    const parsed = parseGenerationOutputs(outputs);

    for (const platformOutput of parsed.platforms) {
      const content = normalizeWhitespace(platformOutput.content ?? "");
      if (content) {
        return appendEllipsis(content, CAPTION_PREVIEW_LENGTH);
      }
    }

    const blendedPrompt = normalizeWhitespace(parsed.blendedPrompt ?? "");
    if (blendedPrompt && !isGenericIdea(blendedPrompt)) {
      return appendEllipsis(blendedPrompt, CAPTION_PREVIEW_LENGTH);
    }
  } catch {
    if (outputs && typeof outputs === "object" && !Array.isArray(outputs)) {
      const record = outputs as Record<string, unknown>;
      const platforms = record.platforms;

      if (Array.isArray(platforms)) {
        for (const entry of platforms) {
          if (
            entry &&
            typeof entry === "object" &&
            "content" in entry &&
            typeof (entry as { content?: unknown }).content === "string"
          ) {
            const content = normalizeWhitespace(
              (entry as { content: string }).content,
            );
            if (content) {
              return appendEllipsis(content, CAPTION_PREVIEW_LENGTH);
            }
          }
        }
      }
    }
  }

  return null;
}

export function resolveHistoryItemTitle(
  idea: string | null | undefined,
  outputs?: Prisma.JsonValue | null,
): string {
  const trimmedIdea = idea?.trim();

  if (trimmedIdea && !isGenericIdea(trimmedIdea)) {
    return truncateHistoryTitle(trimmedIdea);
  }

  if (outputs) {
    const captionPreview = extractCaptionPreview(outputs);
    if (captionPreview) {
      return captionPreview;
    }
  }

  return HISTORY_TITLE_FALLBACK;
}

/** @deprecated Use resolveHistoryItemTitle instead. */
export function getHistoryItemTitle(idea: string | null | undefined): string {
  return resolveHistoryItemTitle(idea);
}

/** @deprecated Use resolveHistoryItemTitle + truncateHistoryTitle instead. */
export function truncateLabel(text: string | null | undefined, max = 42): string {
  return truncateHistoryTitle(resolveHistoryItemTitle(text), max);
}
