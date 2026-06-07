export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface TextModelResult {
  content: string;
  usage: TokenUsage;
}

export function emptyTokenUsage(): TokenUsage {
  return {
    promptTokens: 0,
    completionTokens: 0,
  };
}
