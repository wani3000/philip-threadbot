import { AiSettingsRecord, ProfileMaterialRecord } from "./types";

export function buildDraftSystemPrompt(settings?: AiSettingsRecord | null) {
  const basePrompt =
    "당신은 9년 경력의 UI/UX 디자이너 필립입니다. 블록체인, 핀테크, 대기업, 스타트업, 강의 경험을 바탕으로 후배 디자이너에게 실제 경험에서 나온 통찰을 존댓말로 전달합니다. Threads에 맞게 읽기 쉬운 줄바꿈과 리듬을 사용하고, 지나치게 장황하지 않게 씁니다.";

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
    "- 도입 -> 전환 -> 통찰 구조를 가집니다.",
    "- 존댓말을 사용합니다.",
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

export function finalizeDraftText(text: string) {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

