import { ContentTheme } from "./content-themes";
import { ProfileMaterialRecord, RecentDraftContext } from "./types";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/#[^\s#]+/gu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function buildTokenSet(value: string) {
  return new Set(tokenize(value));
}

function calculateTokenOverlap(left: string, right: string) {
  const leftTokens = buildTokenSet(left);
  const rightTokens = buildTokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersectionCount = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersectionCount += 1;
    }
  }

  return intersectionCount / Math.min(leftTokens.size, rightTokens.size);
}

function normalizedPrefix(value: string, length = 80) {
  return normalizeText(value).slice(0, length);
}

export function findSimilarRecentDraft(input: {
  finalText: string;
  recentPosts: RecentDraftContext[];
  theme: ContentTheme;
  material: ProfileMaterialRecord;
}) {
  return input.recentPosts.find((post) => {
    const overlap = calculateTokenOverlap(input.finalText, post.content);
    const samePrefix =
      normalizedPrefix(input.finalText) !== "" &&
      normalizedPrefix(input.finalText) === normalizedPrefix(post.content);
    const sameTheme = post.themeKey === input.theme.key;
    const sameCategory = post.category === input.material.category;

    if (samePrefix) {
      return true;
    }

    if (overlap >= 0.78) {
      return true;
    }

    if (sameTheme && sameCategory && overlap >= 0.58) {
      return true;
    }

    return false;
  });
}
