import type { AiProvider } from "@prisma/client";

export type ModelKind = "text" | "image";

export interface LiveModelOption {
  value: string;
  label: string;
  provider: "OpenAI" | "Anthropic" | "Google";
  apiProvider: AiProvider;
  kind: ModelKind;
}

export interface LiveModelCatalog {
  textModels: LiveModelOption[];
  imageModels: LiveModelOption[];
  fetchedAt: string;
}

export interface ListModelsOptions {
  refresh?: boolean;
}
