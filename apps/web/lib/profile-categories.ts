export const profileCategoryOptions = [
  { value: "career", label: "경력" },
  { value: "project", label: "프로젝트" },
  { value: "startup_story", label: "창업스토리" },
  { value: "teaching_mentoring", label: "강의멘토링" },
  { value: "designer_insight", label: "디자이너인사이트" },
  { value: "vibe_coding", label: "바이브코딩" }
] as const;

const profileCategoryLabelMap = Object.fromEntries(
  profileCategoryOptions.map((option) => [option.value, option.label])
) as Record<string, string>;

export function getProfileCategoryLabel(value?: string | null) {
  if (!value) {
    return "카테고리 없음";
  }

  return profileCategoryLabelMap[value] ?? value;
}
