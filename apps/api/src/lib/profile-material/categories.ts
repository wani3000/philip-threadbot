export const profileMaterialCategories = [
  "career",
  "project",
  "startup_story",
  "teaching_mentoring",
  "designer_insight",
  "vibe_coding"
] as const;

export type ProfileMaterialCategory =
  (typeof profileMaterialCategories)[number];

export const profileMaterialCategoryLabels: Record<
  ProfileMaterialCategory,
  string
> = {
  career: "경력",
  project: "프로젝트",
  startup_story: "창업스토리",
  teaching_mentoring: "강의멘토링",
  designer_insight: "디자이너인사이트",
  vibe_coding: "바이브코딩"
};
