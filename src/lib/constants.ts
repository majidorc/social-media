import type { Platform } from "@prisma/client";
import {
  AI_IMAGE_MODEL_CONFIG,
  AI_IMAGE_MODEL_VALUES,
  AI_MODEL_CONFIG,
  AI_MODEL_VALUES,
} from "@/lib/ai/models";

export const APP_NAME = "AI Content Hub";

export const AI_MODEL_OPTIONS = AI_MODEL_VALUES.map((value) => ({
  value,
  label: AI_MODEL_CONFIG[value].label,
  provider: AI_MODEL_CONFIG[value].provider,
}));

export const AI_IMAGE_MODEL_OPTIONS = AI_IMAGE_MODEL_VALUES.map((value) => ({
  value,
  label: AI_IMAGE_MODEL_CONFIG[value].label,
  provider: AI_IMAGE_MODEL_CONFIG[value].provider,
}));

export const PLATFORM_OPTIONS: {
  value: Platform;
  label: string;
  description: string;
  characterLimit?: number;
}[] = [
  {
    value: "INSTAGRAM",
    label: "Instagram",
    description: "Hooks, captions, and CapCut script suggestions",
  },
  {
    value: "TWITTER",
    label: "Twitter / X",
    description: "Concise posts respecting character limits",
    characterLimit: 280,
  },
  {
    value: "LINKEDIN",
    label: "LinkedIn",
    description: "Professional tone with thought-leadership framing",
  },
  {
    value: "TIKTOK",
    label: "TikTok",
    description: "Short-form video scripts and trending hooks",
  },
  {
    value: "YOUTUBE",
    label: "YouTube",
    description: "Titles, descriptions, and community posts",
  },
  {
    value: "FACEBOOK",
    label: "Facebook",
    description: "Engaging posts optimized for feed reach",
  },
];

export const API_KEY_PROVIDERS = [
  {
    provider: "OPENAI" as const,
    label: "OpenAI",
    placeholder: "sk-...",
    description: "Used for GPT-4o, GPT-4o Mini, and DALL-E 3 image generation.",
  },
  {
    provider: "GOOGLE" as const,
    label: "Google Gemini",
    placeholder: "AIza...",
    description: "Used for Gemini 2.5 text models and Imagen 3 image generation.",
  },
  {
    provider: "ANTHROPIC" as const,
    label: "Anthropic",
    placeholder: "sk-ant-...",
    description: "Used for Claude Sonnet generations.",
  },
];
