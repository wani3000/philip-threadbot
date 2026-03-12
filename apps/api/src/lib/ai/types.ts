export const aiProviderNames = ["anthropic", "openai", "gemini"] as const;

export type AiProviderName = (typeof aiProviderNames)[number];

export type GenerateTextInput = {
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export type GenerateTextResult = {
  provider: AiProviderName;
  model: string;
  text: string;
  rawResponse: unknown;
};

export interface AiProvider {
  name: AiProviderName;
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
}

