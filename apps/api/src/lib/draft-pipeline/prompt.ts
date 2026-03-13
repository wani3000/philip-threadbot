import { AiSettingsRecord, ProfileMaterialRecord } from "./types";

const maxThreadsCharacters = 500;
const defaultFallbackTags = ["Threads", "디자인", "필립"];

const simonWritingStageRules = [
  "Stage 1 — simon-writing 문체 가공:",
  "- 도입은 추상적 선언 대신 장면, 관찰, 숫자, 감각 중 하나로 시작합니다.",
  '- 첫 문장에서 "저는"으로 시작하지 않습니다.',
  "- 흐름은 상황 -> 내가 놓쳤던 것 -> 해결 -> 결과 순서를 기본 축으로 삼습니다.",
  "- 결론을 먼저 선언하지 말고, 통찰은 마지막 문단에서 도달하도록 만듭니다.",
  "- 짧은 문장과 긴 문장을 교차해 리듬을 만듭니다.",
  "- 장식이 아닌 논증에 기여하는 메타포를 정확히 1개 넣습니다."
].join("\n");

const philipStyleStageRules = [
  "Stage 2 — 필립 스타일 변환:",
  "- 최종 출력은 자연스러운 존댓말로 작성합니다.",
  '- 중반 이후에는 "제가 직접 ~했을 때"처럼 1인칭 경험을 분명히 드러냅니다.',
  "- 디자이너 관점의 언어로 구조, 화면, 사용자 흐름, 정보 가시성, 의사결정을 설명합니다.",
  "- 가능한 한 구체적인 숫자, 결과, 팀/고객 맥락을 반드시 포함합니다.",
  "- 잘난 척하거나 과장하지 말고, 실제 프로젝트에서 얻은 통찰처럼 들리게 씁니다."
].join("\n");

const threadsOptimizationStageRules = [
  "Stage 3 — Threads 최적화:",
  "- 최종 길이는 공백 포함 500자 안팎으로 맞춥니다.",
  "- 단락 사이 줄바꿈으로 읽기 리듬을 만듭니다.",
  "- 첫 줄은 스크롤을 멈추게 하는 훅 역할을 해야 합니다.",
  "- 마지막 줄에는 주제와 맞는 해시태그 3~5개를 넣습니다.",
  "- 광고 문구처럼 보이지 않게 유지합니다."
].join("\n");

export function buildDraftSystemPrompt(settings?: AiSettingsRecord | null) {
  const basePrompt = [
    "당신은 9년 경력의 UI/UX 디자이너 필립입니다.",
    "블록체인, 핀테크, 대기업, 스타트업, 강의 경험을 바탕으로 후배 디자이너에게 실제 경험에서 나온 통찰을 전달합니다.",
    "이 시스템은 simon-writing 방식의 글쓰기 규칙을 먼저 적용한 뒤, 필립의 존댓말 경험 서술과 Threads 문법으로 후처리하는 3단계 파이프라인을 사용합니다.",
    "",
    simonWritingStageRules,
    "",
    philipStyleStageRules,
    "",
    threadsOptimizationStageRules,
    "",
    "중요:",
    "- 결과물은 하나의 완성된 Threads 본문만 반환합니다.",
    "- 단계 이름이나 자기 해설을 출력하지 않습니다.",
    "- 통찰은 실제 시행착오 끝에 도착한 것처럼 자연스럽게 드러냅니다."
  ].join("\n");

  if (!settings?.custom_system_prompt) {
    return basePrompt;
  }

  return `${basePrompt}\n\n추가 시스템 지침:\n${settings.custom_system_prompt}`;
}

export function buildDraftUserPrompt(material: ProfileMaterialRecord) {
  return [
    "다음 원재료를 바탕으로 Threads 초안을 작성해 주세요.",
    "요구사항:",
    "- 가장 배우기까지 오래 걸린 통찰 하나를 중심으로 씁니다.",
    "- 첫 문단은 장면, 관찰, 숫자 중 하나로 바로 시작합니다.",
    "- 상황 -> 내가 놓쳤던 것 -> 해결 -> 결과가 읽히도록 구성합니다.",
    '- 중간 이후에는 "제가 직접 ~했을 때"처럼 내 경험을 자연스럽게 연결합니다.',
    "- 디자이너 관점의 해석과 숫자/성과를 함께 넣습니다.",
    "- 메타포는 1개만 사용하고, 설명용 장식이 아니라 논리를 밀어주는 역할로 씁니다.",
    "- 길이는 500자 안팎으로 맞춥니다.",
    "- 마지막에 3~5개의 해시태그를 포함합니다.",
    "",
    `카테고리: ${material.category}`,
    `제목: ${material.title}`,
    `태그: ${material.tags.join(", ") || "없음"}`,
    "원재료:",
    material.content
  ].join("\n");
}

function normalizeHashtags(tags: string[]) {
  const seen = new Set<string>();

  return tags
    .map((tag) => tag.trim().replace(/^#+/u, ""))
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/\s+/gu, "")}`)
    .filter((tag) => {
      if (seen.has(tag)) {
        return false;
      }

      seen.add(tag);
      return true;
    });
}

function trimBodyToFit(body: string, maxLength: number) {
  if (body.length <= maxLength) {
    return body;
  }

  if (maxLength <= 3) {
    return body.slice(0, maxLength).trim();
  }

  const candidate = body.slice(0, maxLength - 3);
  const lineBreakIndex = candidate.lastIndexOf("\n");
  const spaceIndex = candidate.lastIndexOf(" ");
  const boundary = Math.max(lineBreakIndex, spaceIndex);
  const safeCandidate =
    boundary > Math.floor((maxLength - 3) * 0.6)
      ? candidate.slice(0, boundary)
      : candidate;

  return `${safeCandidate.trimEnd().replace(/[.!?,:;]+$/u, "")}...`;
}

export function finalizeDraftText(text: string, fallbackTags: string[] = []) {
  const cleanedText = text.replace(/\n{3,}/g, "\n\n").trim();
  const extractedHashtags = cleanedText.match(/#[^\s#]+/gu) ?? [];
  const normalizedHashtags = normalizeHashtags([
    ...extractedHashtags,
    ...fallbackTags,
    ...defaultFallbackTags
  ]).slice(0, 5);
  const hashtags = normalizedHashtags.slice(
    0,
    Math.max(3, Math.min(normalizedHashtags.length, 5))
  );
  const hashtagsLine = hashtags.join(" ");
  const body = cleanedText
    .replace(/#[^\s#]+/gu, "")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const separatorLength = body && hashtagsLine ? 2 : 0;
  const maxBodyLength = Math.max(
    0,
    maxThreadsCharacters - hashtagsLine.length - separatorLength
  );
  const trimmedBody = trimBodyToFit(body, maxBodyLength);

  if (!hashtagsLine) {
    return trimmedBody.slice(0, maxThreadsCharacters).trim();
  }

  const finalText = trimmedBody
    ? `${trimmedBody}\n\n${hashtagsLine}`
    : hashtagsLine;

  if (finalText.length <= maxThreadsCharacters) {
    return finalText;
  }

  const hardTrimmedBody = trimBodyToFit(
    trimmedBody,
    Math.max(0, maxThreadsCharacters - hashtagsLine.length - separatorLength)
  );

  return `${hardTrimmedBody}\n\n${hashtagsLine}`.slice(0, maxThreadsCharacters);
}
