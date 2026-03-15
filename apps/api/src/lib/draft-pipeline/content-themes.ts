import { ProfileMaterialCategory } from "../profile-material/categories";

export const contentThemeSequence = [
  {
    key: "ux_for_beginners",
    order: 1,
    label: "UX 어떻게 해야 하는지, 초보 디자이너에게 주는 팁",
    focus:
      "초보 디자이너가 UX를 설계할 때 바로 적용할 수 있는 실전 팁과 판단 기준",
    preferredCategories: ["designer_insight", "teaching_mentoring", "project"]
  },
  {
    key: "why_designers_need_vibe_coding",
    order: 2,
    label: "디자이너가 왜 바이브코딩을 해야 하는지",
    focus: "디자이너가 바이브코딩을 익혀야 하는 이유와 실제로 얻는 작업상 이점",
    preferredCategories: ["vibe_coding", "designer_insight", "project"]
  },
  {
    key: "how_to_build_uiux_portfolio",
    order: 3,
    label: "UIUX 포트폴리오를 어떻게 만들어야 하는지",
    focus: "UIUX 포트폴리오의 구조, 사례 선택, 설명 방식, 결과물 정리 방법",
    preferredCategories: ["teaching_mentoring", "designer_insight", "career"]
  },
  {
    key: "beginner_design_tips",
    order: 4,
    label: "초보 디자이너에게 주는 전체적인 디자인 팁",
    focus:
      "초보 디자이너가 실무와 성장 과정에서 놓치기 쉬운 전체적인 디자인 태도와 팁",
    preferredCategories: ["designer_insight", "teaching_mentoring", "career"]
  },
  {
    key: "importance_of_vibe_coding",
    order: 5,
    label: "바이브코딩의 중요성",
    focus: "바이브코딩이 디자인 실무와 커리어 경쟁력에 어떤 변화를 주는지",
    preferredCategories: ["vibe_coding", "project", "career"]
  },
  {
    key: "philip_designer_experience",
    order: 6,
    label: "디자이너로서 필립의 경험",
    focus: "필립이 디자이너로 일하며 실제로 겪은 상황, 의사결정, 배운 점",
    preferredCategories: ["career", "project", "startup_story"]
  },
  {
    key: "how_to_put_experience_into_portfolio",
    order: 7,
    label: "내 경험을 UIUX 포트폴리오에 녹여내는 방법",
    focus:
      "자신의 실무 경험이나 프로젝트 경험을 포트폴리오 문장과 구성으로 번역하는 방법",
    preferredCategories: ["project", "career", "teaching_mentoring"]
  }
] as const satisfies Array<{
  key: string;
  order: number;
  label: string;
  focus: string;
  preferredCategories: ProfileMaterialCategory[];
}>;

export type ContentThemeKey = (typeof contentThemeSequence)[number]["key"];
export type ContentTheme = (typeof contentThemeSequence)[number];

export type RecentPostThemeContext = {
  postId: string;
  createdAt: string;
  profileId: string | null;
  title: string;
  category: ProfileMaterialCategory | null;
  themeKey: ContentThemeKey | null;
  themeLabel: string | null;
};

const contentThemeMap = new Map(
  contentThemeSequence.map((theme) => [theme.key, theme])
);

export function getContentThemeByKey(key: string | null | undefined) {
  if (!key) {
    return null;
  }

  return contentThemeMap.get(key as ContentThemeKey) ?? null;
}

export function getNextContentTheme(recentPosts: RecentPostThemeContext[]) {
  const latestWithTheme = recentPosts.find((post) =>
    Boolean(getContentThemeByKey(post.themeKey))
  );

  if (latestWithTheme?.themeKey) {
    const currentTheme = getContentThemeByKey(latestWithTheme.themeKey);

    if (currentTheme) {
      return (
        contentThemeSequence[
          currentTheme.order % contentThemeSequence.length
        ] ?? contentThemeSequence[0]
      );
    }
  }

  return contentThemeSequence[0];
}
