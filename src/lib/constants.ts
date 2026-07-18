import type { Platform } from "@prisma/client";

export const APP_NAME = "AI Content Hub";

export const PLATFORM_OPTIONS: {
  value: Platform;
  label: string;
  description: string;
  characterLimit?: number;
}[] = [
  {
    value: "INSTAGRAM",
    label: "Instagram",
    description: "Hooks, captions, and at most 5 hashtags",
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

export const PLATFORM_SHORT_LABELS: Record<Platform, string> = {
  INSTAGRAM: "IG",
  TWITTER: "X",
  LINKEDIN: "LI",
  TIKTOK: "TT",
  YOUTUBE: "YT",
  FACEBOOK: "FB",
};

export const API_KEY_PROVIDERS = [
  {
    provider: "OPENAI" as const,
    label: "OpenAI",
    placeholder: "sk-...",
    description: "Used for GPT and DALL-E models (discovered live from your account).",
    apiKeyHelpUrl: "https://platform.openai.com/api-keys",
  },
  {
    provider: "GOOGLE" as const,
    label: "Google Gemini",
    placeholder: "AIza...",
    description: "Used for Gemini text and Imagen image models (synced via listModels).",
    apiKeyHelpUrl: "https://aistudio.google.com/",
  },
  {
    provider: "ANTHROPIC" as const,
    label: "Anthropic",
    placeholder: "sk-ant-...",
    description: "Used for Claude models (discovered live from your account).",
    apiKeyHelpUrl: "https://console.anthropic.com/settings/keys",
  },
];
