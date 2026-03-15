import { ContentTheme, RecentPostThemeContext } from "./content-themes";
import { AiSettingsRecord, ProfileMaterialRecord } from "./types";
import {
  modelThreadBreakToken,
  serializeThreadSegments
} from "../thread-content";

const maxThreadsCharacters = 500;
const defaultFallbackTags = ["Threads", "디자인", "필립"];
const maxIntermediateSegmentCharacters = 380;
const minThreadSegmentCount = 2;
const maxThreadSegmentCount = 3;

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
  "- 특정 회사명, 기관명, 학교명, 서비스명은 정확한 실명을 그대로 쓰지 않습니다.",
  "- 고유명사는 업종, 지역, 규모, 역할 중심의 일반화 표현으로 바꿉니다. 예: 웁살라시큐리티 -> 싱가포르 블록체인 기업, 피트 -> 헬스케어 스타트업.",
  "- 잘난 척하거나 과장하지 말고, 실제 프로젝트에서 얻은 통찰처럼 들리게 씁니다."
].join("\n");

const threadsOptimizationStageRules = [
  "Stage 3 — Threads 최적화:",
  "- 하나의 긴 글이 아니라 2~3개의 이어쓰기형 Threads 글로 작성합니다.",
  `- 각 글은 반드시 ${modelThreadBreakToken} 토큰으로 구분합니다.`,
  "- 첫 번째 글은 훅과 문제 제기로 시작하고, 마지막 글에서 통찰과 해시태그로 마무리합니다.",
  "- 각 글은 Threads에 바로 게시 가능한 완결된 단위여야 합니다.",
  "- 각 글은 500자를 넘기지 않습니다.",
  "- 단락 사이 줄바꿈으로 읽기 리듬을 만듭니다.",
  "- 첫 번째 글의 첫 줄은 스크롤을 멈추게 하는 훅 역할을 해야 합니다.",
  "- 마지막 글의 마지막 줄에는 주제와 맞는 해시태그 3~5개를 넣습니다.",
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
    "- 결과물은 2~3개의 이어쓰기형 Threads 글만 반환합니다.",
    `- 각 글 사이 구분자는 반드시 ${modelThreadBreakToken} 하나만 사용합니다.`,
    "- 번호, 제목, 단계 이름, 자기 해설을 출력하지 않습니다.",
    "- 통찰은 실제 시행착오 끝에 도착한 것처럼 자연스럽게 드러냅니다."
  ].join("\n");

  if (!settings?.custom_system_prompt) {
    return basePrompt;
  }

  return `${basePrompt}\n\n추가 시스템 지침:\n${settings.custom_system_prompt}`;
}

export function buildDraftUserPrompt(input: {
  material: ProfileMaterialRecord;
  theme: ContentTheme;
  recentPosts: RecentPostThemeContext[];
}) {
  const recentHistoryLines =
    input.recentPosts.length > 0
      ? input.recentPosts.map((post, index) => {
          const parts = [`${index + 1}. ${post.themeLabel ?? "주제 미기록"}`];

          if (post.title) {
            parts.push(`제목: ${post.title}`);
          }

          if (post.category) {
            parts.push(`카테고리: ${post.category}`);
          }

          return parts.join(" / ");
        })
      : ["최근 생성 이력 없음"];

  return [
    "다음 원재료를 바탕으로 Threads 초안을 작성해 주세요.",
    "요구사항:",
    `- 이번 글의 고정 주제는 "${input.theme.label}" 입니다.`,
    `- 이번 글은 반드시 "${input.theme.focus}"에 집중합니다.`,
    "- 아래 주제 순서대로 순환하므로, 현재 주제 외의 다른 순번 주제를 섞지 않습니다.",
    "- 글의 사례, 결론, 표현, CTA, 배운 점이 최근 글과 겹치면 안 됩니다.",
    "- 가장 배우기까지 오래 걸린 통찰 하나를 중심으로 씁니다.",
    `- 총 2~3개의 글로 작성하고, 각 글 사이는 ${modelThreadBreakToken} 토큰으로 구분합니다.`,
    "- 1번 글은 장면, 관찰, 숫자 중 하나로 시작하는 훅과 문제 제기입니다.",
    "- 2번 글은 내가 놓쳤던 것과 해결 과정이 읽히도록 씁니다.",
    "- 3번 글은 결과, 배운 점, 해시태그로 마무리합니다. 내용이 짧으면 2번 글에서 마무리해도 됩니다.",
    '- 중간 이후에는 "제가 직접 ~했을 때"처럼 내 경험을 자연스럽게 연결합니다.',
    "- 디자이너 관점의 해석과 숫자/성과를 함께 넣습니다.",
    "- 원재료에 특정 회사명, 기관명, 학교명, 서비스명이 있어도 실명은 그대로 쓰지 말고 일반화해서 표현합니다.",
    "- 예: 웁살라시큐리티 -> 싱가포르 블록체인 기업, 피트 -> 헬스케어 스타트업.",
    "- 메타포는 1개만 사용하고, 설명용 장식이 아니라 논리를 밀어주는 역할로 씁니다.",
    "- 각 글은 500자를 넘기지 않게 하고, 마지막 글에만 3~5개의 해시태그를 포함합니다.",
    "- 최근 글과 같은 원재료 제목, 같은 사례, 같은 숫자 조합을 반복하지 않습니다.",
    "",
    "주제 순서:",
    "1. UX 어떻게 해야 하는지. 초보 디자이너한테 주는 팁",
    "2. 바이브코딩 디자이너가 왜 해야 하는지",
    "3. UIUX 포트폴리오 어떻게 만들어야 하는지",
    "4. 초보 디자이너에게 주는 전체적인 디자인 팁",
    "5. 바이브코딩의 중요성",
    "6. 디자이너로서 필립의 경험",
    "7. 내 경험을 UIUX 포트폴리오에 녹여내는 방법",
    "",
    "최근 생성 이력:",
    ...recentHistoryLines,
    "",
    `카테고리: ${input.material.category}`,
    `제목: ${input.material.title}`,
    `태그: ${input.material.tags.join(", ") || "없음"}`,
    "원재료:",
    input.material.content
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

function splitIntoParagraphs(text: string) {
  return text
    .split(/\n{2,}/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitIntoSentences(text: string) {
  const matches = text.match(/[^.!?\n]+[.!?]?/gu);

  return (matches ?? [text]).map((entry) => entry.trim()).filter(Boolean);
}

function groupParagraphsIntoSegments(
  paragraphs: string[],
  targetCount: number
) {
  if (paragraphs.length <= targetCount) {
    return paragraphs;
  }

  const totalLength = paragraphs.join("\n\n").length;
  const targetLength = Math.max(1, Math.floor(totalLength / targetCount));
  const segments: string[] = [];
  let currentSegment = "";

  for (const paragraph of paragraphs) {
    const candidate = currentSegment
      ? `${currentSegment}\n\n${paragraph}`
      : paragraph;

    if (
      currentSegment &&
      candidate.length > targetLength &&
      segments.length < targetCount - 1
    ) {
      segments.push(currentSegment);
      currentSegment = paragraph;
      continue;
    }

    currentSegment = candidate;
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

function splitLargestSegment(segments: string[]) {
  if (segments.length === 0) {
    return segments;
  }

  const sortedIndex = [...segments.keys()].sort(
    (left, right) => segments[right].length - segments[left].length
  )[0];
  const target = segments[sortedIndex];
  const sentences = splitIntoSentences(target);

  if (sentences.length < 2) {
    return segments;
  }

  const halfway = Math.ceil(sentences.length / 2);
  const nextSegments = [...segments];
  nextSegments.splice(
    sortedIndex,
    1,
    sentences.slice(0, halfway).join(" ").trim(),
    sentences.slice(halfway).join(" ").trim()
  );

  return nextSegments;
}

function normalizeThreadSegmentCount(rawSegments: string[]) {
  let segments = rawSegments.filter(Boolean);

  if (segments.length === 0) {
    return segments;
  }

  const bodyLength = segments.join("\n\n").length;
  const targetCount =
    bodyLength > 420 ? maxThreadSegmentCount : minThreadSegmentCount;

  if (segments.length === 1) {
    const paragraphs = splitIntoParagraphs(segments[0]);
    segments =
      paragraphs.length > 1
        ? groupParagraphsIntoSegments(paragraphs, targetCount)
        : segments;
  }

  while (segments.length < targetCount) {
    const nextSegments = splitLargestSegment(segments);

    if (nextSegments.length === segments.length) {
      break;
    }

    segments = nextSegments;
  }

  while (segments.length > maxThreadSegmentCount) {
    const lastSegment = segments.pop();

    if (!lastSegment) {
      break;
    }

    segments[segments.length - 1] =
      `${segments[segments.length - 1]}\n\n${lastSegment}`;
  }

  return segments.slice(0, maxThreadSegmentCount);
}

function finalizeIntermediateSegment(text: string) {
  const body = text
    .replace(/#[^\s#]+/gu, "")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return trimBodyToFit(body, maxIntermediateSegmentCharacters);
}

function finalizeLastSegment(text: string, hashtags: string[]) {
  const hashtagsLine = hashtags.join(" ");
  const body = text
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

  return hashtagsLine
    ? `${trimmedBody}\n\n${hashtagsLine}`.trim()
    : trimmedBody;
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
  const rawSegments = cleanedText
    .split(modelThreadBreakToken)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const normalizedSegments = normalizeThreadSegmentCount(
    rawSegments.length > 0 ? rawSegments : [cleanedText]
  );
  const finalizedSegments = normalizedSegments.map((segment, index) =>
    index === normalizedSegments.length - 1
      ? finalizeLastSegment(segment, hashtags)
      : finalizeIntermediateSegment(segment)
  );

  return {
    segments: finalizedSegments,
    combinedText: serializeThreadSegments(finalizedSegments)
  };
}
