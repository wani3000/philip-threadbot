import { createSupabaseAdminClient } from "../supabase";
import { buildDefaultAiSettingsPayload } from "../ai-settings/defaults";
import {
  createDemoGeneratedDraft,
  getDemoAiSettings,
  listDemoPosts,
  markDemoMaterialUsed,
  selectDemoProfileMaterial
} from "../demo-store";
import { isDemoModeEnabled } from "../runtime";
import type { ContentTheme } from "./content-themes";
import type {
  AiSettingsRecord,
  DraftPipelineInput,
  ProfileMaterialRecord,
  RecentDraftContext
} from "./types";

function buildMaterialQuery(input: DraftPipelineInput) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("philip_profiles")
    .select(
      "id, category, title, content, tags, priority, used_count, last_used_at, is_active"
    )
    .eq("is_active", true);

  if (input.profileId) {
    query = query.eq("id", input.profileId);
  }

  if (input.category) {
    query = query.eq("category", input.category);
  }

  return query;
}

function scorePriority(priority: ProfileMaterialRecord["priority"]) {
  return {
    high: 0,
    medium: 1,
    low: 2
  }[priority];
}

export async function getDefaultAiSettings() {
  if (isDemoModeEnabled()) {
    return getDemoAiSettings();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("ai_settings")
    .select(
      "id, default_provider, default_model, custom_system_prompt, tone_settings, default_post_time, timezone"
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AiSettingsRecord>();

  if (error) {
    throw error;
  }

  if (!data) {
    const { data: created, error: createError } = await supabase
      .from("ai_settings")
      .insert(buildDefaultAiSettingsPayload())
      .select(
        "id, default_provider, default_model, custom_system_prompt, tone_settings, default_post_time, timezone"
      )
      .single<AiSettingsRecord>();

    if (createError) {
      throw createError;
    }

    return created;
  }

  return data;
}

export async function selectProfileMaterial(
  input: DraftPipelineInput,
  options?: {
    preferredCategories?: ProfileMaterialRecord["category"][];
    excludedProfileIds?: string[];
  }
) {
  if (isDemoModeEnabled()) {
    return selectDemoProfileMaterial(input);
  }

  const { data, error } = await buildMaterialQuery(input);

  if (error) {
    throw error;
  }

  const materials = (data ?? []) as ProfileMaterialRecord[];

  if (materials.length === 0) {
    throw new Error("활성화된 원재료를 찾을 수 없습니다.");
  }

  const preferredCategoryOrder = new Map(
    (options?.preferredCategories ?? []).map((category, index) => [
      category,
      index
    ])
  );
  const excludedProfileIds = new Set(options?.excludedProfileIds ?? []);

  const selected = [...materials].sort((left, right) => {
    const leftExcludedPenalty = excludedProfileIds.has(left.id) ? 1 : 0;
    const rightExcludedPenalty = excludedProfileIds.has(right.id) ? 1 : 0;

    if (leftExcludedPenalty !== rightExcludedPenalty) {
      return leftExcludedPenalty - rightExcludedPenalty;
    }

    const leftCategoryRank = preferredCategoryOrder.get(left.category) ?? 999;
    const rightCategoryRank = preferredCategoryOrder.get(right.category) ?? 999;

    if (leftCategoryRank !== rightCategoryRank) {
      return leftCategoryRank - rightCategoryRank;
    }

    const priorityCompare =
      scorePriority(left.priority) - scorePriority(right.priority);

    if (priorityCompare !== 0) {
      return priorityCompare;
    }

    const usedCountCompare = left.used_count - right.used_count;

    if (usedCountCompare !== 0) {
      return usedCountCompare;
    }

    return (left.last_used_at ?? "").localeCompare(right.last_used_at ?? "");
  })[0];

  return selected;
}

export async function getGeneratedPostCount() {
  if (isDemoModeEnabled()) {
    return listDemoPosts({ limit: 500 }).length;
  }

  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listRecentDraftContexts(limit = 6) {
  if (isDemoModeEnabled()) {
    return listDemoPosts({ limit }).map((post) => ({
      postId: post.id,
      createdAt: post.created_at,
      profileId: post.profile_id,
      title:
        typeof post.source_snapshot?.title === "string"
          ? post.source_snapshot.title
          : "제목 없음",
      category:
        typeof post.source_snapshot?.category === "string"
          ? post.source_snapshot.category
          : null,
      themeKey:
        typeof post.generation_notes?.theme_key === "string"
          ? post.generation_notes.theme_key
          : null,
      themeLabel:
        typeof post.generation_notes?.theme_label === "string"
          ? post.generation_notes.theme_label
          : null
    })) as RecentDraftContext[];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, created_at, profile_id, source_snapshot, generation_notes")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []).map((post) => {
    const sourceSnapshot =
      typeof post.source_snapshot === "object" && post.source_snapshot
        ? post.source_snapshot
        : {};
    const generationNotes =
      typeof post.generation_notes === "object" && post.generation_notes
        ? post.generation_notes
        : {};

    return {
      postId: post.id,
      createdAt: post.created_at,
      profileId: post.profile_id,
      title:
        typeof sourceSnapshot.title === "string"
          ? sourceSnapshot.title
          : "제목 없음",
      category:
        typeof sourceSnapshot.category === "string"
          ? sourceSnapshot.category
          : null,
      themeKey:
        typeof generationNotes.theme_key === "string"
          ? generationNotes.theme_key
          : null,
      themeLabel:
        typeof generationNotes.theme_label === "string"
          ? generationNotes.theme_label
          : null
    };
  }) as RecentDraftContext[];
}

export async function markMaterialUsed(profileId: string) {
  if (isDemoModeEnabled()) {
    markDemoMaterialUsed(profileId);
    return;
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("philip_profiles")
    .select("used_count")
    .eq("id", profileId)
    .single<{ used_count: number }>();

  if (error) {
    throw error;
  }

  const { error: updateError } = await supabase
    .from("philip_profiles")
    .update({
      used_count: (data?.used_count ?? 0) + 1,
      last_used_at: new Date().toISOString()
    })
    .eq("id", profileId);

  if (updateError) {
    throw updateError;
  }
}

export async function saveGeneratedDraft({
  material,
  generatedContent,
  threadSegments,
  provider,
  model,
  rawResponse,
  scheduledAt,
  theme
}: {
  material: ProfileMaterialRecord;
  generatedContent: string;
  threadSegments: string[];
  provider: string;
  model: string;
  rawResponse: unknown;
  scheduledAt?: string;
  theme: ContentTheme;
}) {
  if (isDemoModeEnabled()) {
    return createDemoGeneratedDraft({
      material,
      generatedContent,
      threadSegments,
      provider,
      model,
      rawResponse,
      scheduledAt,
      theme
    });
  }

  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      profile_id: material.id,
      source_snapshot: material,
      raw_content: material.content,
      generated_content: generatedContent,
      ai_provider: provider,
      ai_model: model,
      status: scheduledAt ? "scheduled" : "draft",
      scheduled_at: scheduledAt ?? null,
      generation_notes: {
        title: material.title,
        tags: material.tags,
        theme_key: theme.key,
        theme_label: theme.label,
        theme_order: theme.order,
        thread_segments: threadSegments,
        rawResponse
      }
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
