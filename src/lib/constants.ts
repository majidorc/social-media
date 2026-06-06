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
    description: "Used for GPT and DALL-E models (discovered live from your account).",
  },
  {
    provider: "GOOGLE" as const,
    label: "Google Gemini",
    placeholder: "AIza...",
    description: "Used for Gemini text and Imagen image models (synced via listModels).",
  },
  {
    provider: "ANTHROPIC" as const,
    label: "Anthropic",
    placeholder: "sk-ant-...",
    description: "Used for Claude models (discovered live from your account).",
  },
];
