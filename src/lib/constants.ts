import type { AiModel, Platform } from "@prisma/client";

export const APP_NAME = "AI Content Hub";

export const AI_MODEL_OPTIONS: {
  value: AiModel;
  label: string;
  provider: "OpenAI" | "Anthropic" | "Google";
}[] = [
  { value: "GPT_4O", label: "GPT-4o", provider: "OpenAI" },
  { value: "GPT_4O_MINI", label: "GPT-4o Mini", provider: "OpenAI" },
  {
    value: "CLAUDE_35_SONNET",
    label: "Claude 3.5 Sonnet",
    provider: "Anthropic",
  },
  { value: "GEMINI_15_PRO", label: "Gemini 1.5 Pro", provider: "Google" },
  { value: "GEMINI_15_FLASH", label: "Gemini 1.5 Flash", provider: "Google" },
];

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
    description: "Used for GPT-4o and GPT-4o Mini generations.",
  },
  {
    provider: "GOOGLE" as const,
    label: "Google Gemini",
    placeholder: "AIza...",
    description: "Used for Gemini 1.5 Pro and Flash generations.",
  },
  {
    provider: "ANTHROPIC" as const,
    label: "Anthropic",
    placeholder: "sk-ant-...",
    description: "Used for Claude 3.5 Sonnet generations.",
  },
];

export const DEMO_USER_EMAIL = "demo@aicontenthub.local";
