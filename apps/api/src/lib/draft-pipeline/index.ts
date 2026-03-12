import { getAiProvider } from "../ai/providers";
import { AiProviderName } from "../ai/types";
import { finalizeDraftText, buildDraftSystemPrompt, buildDraftUserPrompt } from "./prompt";
import {
  getDefaultAiSettings,
  markMaterialUsed,
  saveGeneratedDraft,
  selectProfileMaterial
} from "./store";
import { DraftPipelineInput } from "./types";

const fallbackModels: Record<AiProviderName, string> = {
  anthropic: "claude-3-7-sonnet-latest",
  openai: "gpt-4.1-mini",
  gemini: "gemini-2.0-flash"
};

export async function generateDraftFromProfile(input: DraftPipelineInput) {
  const settings = await getDefaultAiSettings();
  const material = await selectProfileMaterial(input);

  const providerName =
    input.provider ??
    ((settings?.default_provider as AiProviderName | undefined) ?? "anthropic");
  const model = input.model ?? settings?.default_model ?? fallbackModels[providerName];
  const provider = getAiProvider(providerName);

  const systemPrompt = buildDraftSystemPrompt(settings);
  const userPrompt = buildDraftUserPrompt(material);
  const result = await provider.generateText({
    model,
    systemPrompt,
    userPrompt,
    maxOutputTokens: 700,
    temperature: 0.85
  });

  const finalText = finalizeDraftText(result.text);

  if (!finalText) {
    throw new Error("AI가 비어 있는 초안을 반환했습니다.");
  }

  await markMaterialUsed(material.id);

  const draft = await saveGeneratedDraft({
    material,
    generatedContent: finalText,
    provider: result.provider,
    model: result.model,
    rawResponse: result.rawResponse,
    scheduledAt: input.scheduledAt
  });

  return {
    material,
    settings,
    draft,
    provider: result.provider,
    model: result.model
  };
}

