type DraftPreviewTemplateInput = {
  scheduledAt?: string;
  aiModel?: string;
  materialCategory?: string;
  segments: string[];
  dashboardUrl?: string;
};

export function renderDraftPreviewMessage({
  scheduledAt,
  aiModel,
  materialCategory,
  segments,
  dashboardUrl
}: DraftPreviewTemplateInput) {
  const segmentLines =
    segments.length > 1
      ? segments.flatMap((segment, index) => [
          `[이어쓰기 ${index + 1}/${segments.length}]`,
          segment,
          ""
        ])
      : [segments[0] ?? ""];
  const lines = [
    "[Philip Threadbot] 내일 게시 예정 초안",
    scheduledAt ? `게시 예정: ${scheduledAt}` : null,
    aiModel ? `AI 모델: ${aiModel}` : null,
    materialCategory ? `원재료 카테고리: ${materialCategory}` : null,
    "",
    ...segmentLines,
    dashboardUrl ? "" : null,
    dashboardUrl ? `대시보드: ${dashboardUrl}` : null
  ];

  return lines.filter(Boolean).join("\n");
}
