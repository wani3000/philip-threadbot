import { getAiProvider } from "../ai/providers";
import { AiProviderName } from "../ai/types";
import { isDemoModeEnabled } from "../runtime";
import {
  finalizeDraftText,
  buildDraftSystemPrompt,
  buildDraftUserPrompt
} from "./prompt";
import {
  getDefaultAiSettings,
  markMaterialUsed,
  saveGeneratedDraft,
  selectProfileMaterial
} from "./store";
import { DraftPipelineInput } from "./types";

const fallbackModels: Record<AiProviderName, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4.1-mini",
  gemini: "gemini-2.0-flash"
};

function generateDemoDraftText(material: {
  title: string;
  content: string;
  tags: string[];
}) {
  const firstSentence =
    material.content.split(".")[0]?.trim() ?? material.title;
  const hashtags = (
    material.tags.length ? material.tags : ["Threads", "디자인", "필립"]
  )
    .slice(0, 4)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");

  return [
    `${material.title} 이야기는 늘 결과보다 장면이 먼저 떠오릅니다.`,
    "",
    `${firstSentence} 제가 직접 구조를 다시 잡았을 때, 문제는 일이 많다는 사실보다 어디를 먼저 봐야 하는지 보이지 않는 데 있다는 걸 알았습니다.`,
    "",
    "디자이너가 만드는 화면은 예쁘게 정리된 판넬이 아니라, 팀의 판단 속도를 바꾸는 지도에 더 가깝습니다.",
    "",
    `${hashtags}`
  ].join("\n");
}

export async function generateDraftFromProfile(input: DraftPipelineInput) {
  const settings = await getDefaultAiSettings();
  const material = await selectProfileMaterial(input);

  const providerName =
    input.provider ??
    (settings?.default_provider as AiProviderName | undefined) ??
    "anthropic";
  const model =
    input.model ?? settings?.default_model ?? fallbackModels[providerName];
  const provider = getAiProvider(providerName);

  const systemPrompt = buildDraftSystemPrompt(settings);
  const userPrompt = buildDraftUserPrompt(material);

  const result = isDemoModeEnabled()
    ? {
        provider: providerName,
        model,
        text: generateDemoDraftText(material),
        rawResponse: {
          mode: "demo",
          systemPrompt,
          userPrompt
        }
      }
    : await provider.generateText({
        model,
        systemPrompt,
        userPrompt,
        maxOutputTokens: 700,
        temperature: 0.85
      });

  const finalText = finalizeDraftText(result.text, material.tags);

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
