import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import { openAiProvider } from "./openai";
import { AiProvider, AiProviderName } from "../types";

const providers: Record<AiProviderName, AiProvider> = {
  anthropic: anthropicProvider,
  openai: openAiProvider,
  gemini: geminiProvider
};

export function getAiProvider(providerName: AiProviderName) {
  return providers[providerName];
}

