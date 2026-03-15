import { getAiProvider } from "../ai/providers";
import { AiProviderName } from "../ai/types";
import { isDemoModeEnabled } from "../runtime";
import { getNextContentTheme } from "./content-themes";
import {
  finalizeDraftText,
  buildDraftSystemPrompt,
  buildDraftUserPrompt
} from "./prompt";
import {
  getDefaultAiSettings,
  listRecentDraftContexts,
  markMaterialUsed,
  saveGeneratedDraft,
  selectProfileMaterial
} from "./store";
import { DraftPipelineInput } from "./types";
import { findSimilarRecentDraft } from "./uniqueness";

const fallbackModels: Record<AiProviderName, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4.1-mini",
  gemini: "gemini-2.0-flash"
};

function generateDemoDraftText(material: {
  title: string;
  content: string;
  tags: string[];
  themeLabel: string;
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
    `${material.themeLabel} 이야기를 할 때도 결국 출발점은 장면이었습니다.`,
    "",
    `${firstSentence} 문제는 일이 많다는 사실보다 어디를 먼저 봐야 하는지 보이지 않는 데 있었습니다.`,
    "<<<THREAD_BREAK>>>",
    "제가 직접 구조를 다시 잡았을 때, 흐름은 훨씬 선명해졌고 팀이 같은 화면을 보며 같은 판단을 할 수 있게 됐습니다.",
    "<<<THREAD_BREAK>>>",
    `디자이너가 만드는 화면은 예쁘게 정리된 판넬이 아니라, 팀의 판단 속도를 바꾸는 지도에 더 가깝습니다.\n\n${hashtags}`
  ].join("\n\n");
}

export async function generateDraftFromProfile(input: DraftPipelineInput) {
  const settings = await getDefaultAiSettings();
  const recentPosts = await listRecentDraftContexts();
  const theme = getNextContentTheme(recentPosts);
  const material = await selectProfileMaterial(input, {
    preferredCategories: input.category
      ? undefined
      : [...theme.preferredCategories],
    excludedProfileIds: recentPosts
      .map((post) => post.profileId)
      .filter((value): value is string => Boolean(value))
  });

  const providerName =
    input.provider ??
    (settings?.default_provider as AiProviderName | undefined) ??
    "anthropic";
  const model =
    input.model ?? settings?.default_model ?? fallbackModels[providerName];
  const provider = getAiProvider(providerName);

  const systemPrompt = buildDraftSystemPrompt(settings);
  const userPrompt = buildDraftUserPrompt({
    material,
    theme,
    recentPosts
  });

  const result = isDemoModeEnabled()
    ? {
        provider: providerName,
        model,
        text: generateDemoDraftText({
          ...material,
          themeLabel: theme.label
        }),
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

  const finalThread = finalizeDraftText(result.text, material.tags);
  const finalText = finalThread.combinedText;

  if (!finalText) {
    throw new Error("AI가 비어 있는 초안을 반환했습니다.");
  }

  const similarRecentDraft = findSimilarRecentDraft({
    finalText,
    recentPosts,
    theme,
    material
  });

  if (similarRecentDraft) {
    throw new Error(
      `최근 글과 내용이 너무 유사합니다. (${similarRecentDraft.title}) 다른 원재료나 다음 주제로 다시 생성해 주세요.`
    );
  }

  await markMaterialUsed(material.id);

  const draft = await saveGeneratedDraft({
    material,
    generatedContent: finalText,
    threadSegments: finalThread.segments,
    provider: result.provider,
    model: result.model,
    rawResponse: result.rawResponse,
    scheduledAt: input.scheduledAt,
    theme
  });

  return {
    material,
    settings,
    theme,
    recentPosts,
    draft,
    provider: result.provider,
    model: result.model
  };
}
