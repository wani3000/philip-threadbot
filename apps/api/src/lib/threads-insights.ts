import { createSupabaseAdminClient } from "./supabase";
import {
  getDemoThreadsInsightsSummary,
  syncDemoThreadsInsights
} from "./demo-store";
import { isDemoModeEnabled } from "./runtime";
import { env } from "../config/env";
import {
  getThreadsMediaInsights,
  getThreadsUserInsights,
  ThreadsApiError
} from "./threads/client";
import { logger } from "./logger";

type InsightMetricPayload = {
  name?: string;
  values?: Array<{ value?: number | null }>;
  total_value?: {
    value?: number | null;
  };
};

type PublishedPostRecord = {
  id: string;
  thread_id: string | null;
  thread_permalink: string | null;
  published_at: string | null;
  generation_notes: {
    insights_media_ids?: string[];
  } | null;
  source_snapshot: {
    title?: string;
    category?: string;
  } | null;
};

type AccountInsightSnapshot = {
  id: string;
  threads_user_id: string;
  views: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  quotes: number | null;
  followers_count: number | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

type PostInsightSnapshot = {
  id: string;
  post_id: string;
  threads_media_id: string;
  views: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  quotes: number | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

function buildEmptyInsightsSummary() {
  return {
    lastSyncedAt: null,
    account: null,
    summary: {
      publishedPostCount: 0,
      trackedPostCount: 0,
      recentViewTotal: 0,
      recentEngagementTotal: 0,
      averageEngagementRate: 0
    },
    latestPosts: [] as Array<{
      postId: string;
      title: string;
      category: string | null;
      permalink: string | null;
      publishedAt: string | null;
      views: number;
      likes: number;
      replies: number;
      reposts: number;
      quotes: number;
      engagement: number;
    }>,
    topPosts: [] as Array<{
      postId: string;
      title: string;
      category: string | null;
      permalink: string | null;
      publishedAt: string | null;
      views: number;
      likes: number;
      replies: number;
      reposts: number;
      quotes: number;
      engagement: number;
    }>,
    categoryBreakdown: [] as Array<{
      category: string;
      postCount: number;
      materialCount: number;
      totalViews: number;
      totalEngagement: number;
    }>
  };
}

function isMissingInsightsTableError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : String(error ?? "");
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  return (
    code === "PGRST205" ||
    /threads_(account|post)_insights_snapshots|relation .* does not exist|schema cache/iu.test(
      message
    )
  );
}

function isUnsupportedThreadsMediaError(error: unknown) {
  if (!(error instanceof ThreadsApiError)) {
    return false;
  }

  const payload = error.payload as {
    error?: {
      code?: number;
      error_subcode?: number;
    };
  };

  return (
    error.status === 400 &&
    payload.error?.code === 100 &&
    payload.error?.error_subcode === 33
  );
}

function normalizeInsightMetrics(payload: {
  data?: InsightMetricPayload[];
}): Record<string, number | null> {
  return (payload.data ?? []).reduce<Record<string, number | null>>(
    (accumulator, item) => {
      if (!item.name) {
        return accumulator;
      }

      const totalValue = item.total_value?.value;
      const firstValue = item.values?.[0]?.value;
      const value =
        typeof totalValue === "number"
          ? totalValue
          : typeof firstValue === "number"
            ? firstValue
            : null;

      accumulator[item.name] = value;
      return accumulator;
    },
    {}
  );
}

function calculateEngagement(input: {
  likes?: number | null;
  replies?: number | null;
  reposts?: number | null;
  quotes?: number | null;
}) {
  return (
    (input.likes ?? 0) +
    (input.replies ?? 0) +
    (input.reposts ?? 0) +
    (input.quotes ?? 0)
  );
}

async function fetchPublishedPosts(limit = 24) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, thread_id, thread_permalink, published_at, generation_notes, source_snapshot"
    )
    .eq("status", "published")
    .not("thread_id", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit)
    .returns<PublishedPostRecord[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

type PublishAttemptLookup = {
  post_id: string;
  response_payload: {
    root?: {
      publishResult?: { id?: string };
      details?: { id?: string };
    };
    replyChain?: Array<{
      threadId?: string;
    }>;
  } | null;
  created_at: string;
};

function dedupeStringList(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0
      )
    )
  );
}

function extractInsightMediaIdsFromNotes(
  generationNotes: PublishedPostRecord["generation_notes"]
) {
  const rawIds = generationNotes?.insights_media_ids;

  if (!Array.isArray(rawIds)) {
    return [] as string[];
  }

  return dedupeStringList(
    rawIds.map((value) => (typeof value === "string" ? value : null))
  );
}

function extractInsightMediaIdsFromPublishAttempt(
  payload: PublishAttemptLookup["response_payload"]
) {
  if (!payload) {
    return [] as string[];
  }

  return dedupeStringList([
    payload.root?.publishResult?.id,
    payload.root?.details?.id,
    ...(payload.replyChain ?? []).map((item) => item.threadId)
  ]);
}

async function fetchLatestSuccessfulPublishAttempts(postIds: string[]) {
  if (postIds.length === 0) {
    return new Map<string, PublishAttemptLookup>();
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("publish_attempts")
    .select("post_id, response_payload, created_at")
    .in("post_id", postIds)
    .eq("success", true)
    .order("created_at", { ascending: false })
    .returns<PublishAttemptLookup[]>();

  if (error) {
    throw error;
  }

  const latestByPostId = new Map<string, PublishAttemptLookup>();

  for (const attempt of data ?? []) {
    if (!latestByPostId.has(attempt.post_id)) {
      latestByPostId.set(attempt.post_id, attempt);
    }
  }

  return latestByPostId;
}

async function persistInsightMediaIds(postId: string, mediaIds: string[]) {
  if (mediaIds.length === 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("generation_notes")
    .eq("id", postId)
    .maybeSingle<{ generation_notes?: Record<string, unknown> | null }>();

  if (existingError) {
    throw existingError;
  }

  const { error } = await supabase
    .from("posts")
    .update({
      generation_notes: {
        ...(existing?.generation_notes ?? {}),
        insights_media_ids: mediaIds
      }
    })
    .eq("id", postId);

  if (error) {
    throw error;
  }
}

function aggregateMetricPayloads(
  payloads: Array<Record<string, unknown>>
): Record<string, number | null> {
  const totals = {
    views: 0,
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0
  };

  for (const payload of payloads) {
    const metrics = normalizeInsightMetrics(
      payload as { data?: InsightMetricPayload[] }
    );
    totals.views += metrics.views ?? 0;
    totals.likes += metrics.likes ?? 0;
    totals.replies += metrics.replies ?? 0;
    totals.reposts += metrics.reposts ?? 0;
    totals.quotes += metrics.quotes ?? 0;
  }

  return totals;
}

async function resolveInsightMediaIdsForPost(
  post: PublishedPostRecord,
  latestAttemptsByPostId: Map<string, PublishAttemptLookup>
) {
  const fromNotes = extractInsightMediaIdsFromNotes(post.generation_notes);

  if (fromNotes.length > 0) {
    return fromNotes;
  }

  const fromAttempts = extractInsightMediaIdsFromPublishAttempt(
    latestAttemptsByPostId.get(post.id)?.response_payload ?? null
  );

  if (fromAttempts.length > 0) {
    await persistInsightMediaIds(post.id, fromAttempts);
    return fromAttempts;
  }

  return dedupeStringList([post.thread_id]);
}

async function insertAccountSnapshot(snapshot: {
  threadsUserId: string;
  metrics: Record<string, number | null>;
  rawPayload: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("threads_account_insights_snapshots")
    .insert({
      threads_user_id: snapshot.threadsUserId,
      views: snapshot.metrics.views ?? null,
      likes: snapshot.metrics.likes ?? null,
      replies: snapshot.metrics.replies ?? null,
      reposts: snapshot.metrics.reposts ?? null,
      quotes: snapshot.metrics.quotes ?? null,
      followers_count: snapshot.metrics.followers_count ?? null,
      raw_payload: snapshot.rawPayload
    });

  if (error) {
    throw error;
  }
}

async function insertPostSnapshots(
  snapshots: Array<{
    postId: string;
    threadsMediaId: string;
    metrics: Record<string, number | null>;
    rawPayload: Record<string, unknown>;
  }>
) {
  if (snapshots.length === 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("threads_post_insights_snapshots")
    .insert(
      snapshots.map((snapshot) => ({
        post_id: snapshot.postId,
        threads_media_id: snapshot.threadsMediaId,
        views: snapshot.metrics.views ?? null,
        likes: snapshot.metrics.likes ?? null,
        replies: snapshot.metrics.replies ?? null,
        reposts: snapshot.metrics.reposts ?? null,
        quotes: snapshot.metrics.quotes ?? null,
        raw_payload: snapshot.rawPayload
      }))
    );

  if (error) {
    throw error;
  }
}

async function fetchLatestAccountSnapshot() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("threads_account_insights_snapshots")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<AccountInsightSnapshot>();

  if (error) {
    throw error;
  }

  return data;
}

async function fetchLatestPostSnapshots(postIds: string[]) {
  if (postIds.length === 0) {
    return [] as PostInsightSnapshot[];
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("threads_post_insights_snapshots")
    .select("*")
    .in("post_id", postIds)
    .order("created_at", { ascending: false })
    .returns<PostInsightSnapshot[]>();

  if (error) {
    throw error;
  }

  const latestByPost = new Map<string, PostInsightSnapshot>();

  for (const snapshot of data ?? []) {
    if (!latestByPost.has(snapshot.post_id)) {
      latestByPost.set(snapshot.post_id, snapshot);
    }
  }

  return Array.from(latestByPost.values());
}

export async function syncThreadsInsights(limit = 12) {
  if (isDemoModeEnabled()) {
    return syncDemoThreadsInsights();
  }

  if (!env.THREADS_ACCESS_TOKEN || !env.THREADS_USER_ID) {
    throw new Error(
      "Threads insights sync requires THREADS_ACCESS_TOKEN and THREADS_USER_ID."
    );
  }

  try {
    const publishedPosts = await fetchPublishedPosts(limit);
    const accountPayload = await getThreadsUserInsights(
      env.THREADS_ACCESS_TOKEN
    );
    const accountMetrics = normalizeInsightMetrics(accountPayload);
    const latestAttemptsByPostId = await fetchLatestSuccessfulPublishAttempts(
      publishedPosts.map((post) => post.id)
    );

    await insertAccountSnapshot({
      threadsUserId: env.THREADS_USER_ID,
      metrics: accountMetrics,
      rawPayload: accountPayload as Record<string, unknown>
    });

    const postSnapshots: Array<{
      postId: string;
      threadsMediaId: string;
      metrics: Record<string, number | null>;
      rawPayload: Record<string, unknown>;
    }> = [];

    for (const post of publishedPosts) {
      const candidateMediaIds = await resolveInsightMediaIdsForPost(
        post,
        latestAttemptsByPostId
      );

      if (candidateMediaIds.length === 0) {
        continue;
      }

      const successfulPayloads: Array<{
        mediaId: string;
        payload: Record<string, unknown>;
      }> = [];

      for (const mediaId of candidateMediaIds) {
        try {
          const payload = await getThreadsMediaInsights({
            accessToken: env.THREADS_ACCESS_TOKEN,
            threadId: mediaId
          });
          successfulPayloads.push({
            mediaId,
            payload: payload as Record<string, unknown>
          });
        } catch (error) {
          if (isUnsupportedThreadsMediaError(error)) {
            logger.warn("threads.insights.media_candidate_skipped", {
              postId: post.id,
              threadId: post.thread_id,
              mediaId,
              reason: "unsupported_media_lookup"
            });
            continue;
          }

          throw error;
        }
      }

      if (successfulPayloads.length === 0) {
        logger.warn("threads.insights.post_skipped", {
          postId: post.id,
          threadId: post.thread_id,
          candidateMediaIds,
          reason: "no_supported_media_lookup"
        });
        continue;
      }

      postSnapshots.push({
        postId: post.id,
        threadsMediaId: successfulPayloads[0].mediaId,
        metrics: aggregateMetricPayloads(
          successfulPayloads.map((item) => item.payload)
        ),
        rawPayload: {
          candidateMediaIds,
          matchedMediaIds: successfulPayloads.map((item) => item.mediaId),
          segments: successfulPayloads.map((item) => ({
            mediaId: item.mediaId,
            payload: item.payload
          }))
        }
      });

      const matchedIds = successfulPayloads.map((item) => item.mediaId);
      const existingIds = extractInsightMediaIdsFromNotes(
        post.generation_notes
      );

      if (matchedIds.join(",") !== existingIds.join(",")) {
        await persistInsightMediaIds(post.id, matchedIds);
      }
    }

    await insertPostSnapshots(postSnapshots);

    return {
      syncedAt: new Date().toISOString(),
      syncedAccount: true,
      syncedPosts: postSnapshots.length
    };
  } catch (error) {
    if (isMissingInsightsTableError(error)) {
      throw new Error(
        "Threads 인사이트 테이블이 아직 없습니다. 0004_threads_insights.sql 마이그레이션을 먼저 적용해 주세요."
      );
    }

    throw error;
  }
}

export async function getThreadsInsightsSummary() {
  if (isDemoModeEnabled()) {
    return getDemoThreadsInsightsSummary();
  }

  let latestAccountSnapshot: AccountInsightSnapshot | null | undefined;
  let latestPostSnapshots: PostInsightSnapshot[] = [];

  try {
    latestAccountSnapshot = await fetchLatestAccountSnapshot();
    const publishedPosts = await fetchPublishedPosts(24);
    latestPostSnapshots = await fetchLatestPostSnapshots(
      publishedPosts.map((post) => post.id)
    );
    const snapshotByPostId = new Map(
      latestPostSnapshots.map((snapshot) => [snapshot.post_id, snapshot])
    );

    const latestPosts = publishedPosts.map((post) => {
      const snapshot = snapshotByPostId.get(post.id);
      const engagement = calculateEngagement(snapshot ?? {});

      return {
        postId: post.id,
        title: post.source_snapshot?.title ?? "제목 없음",
        category: post.source_snapshot?.category ?? null,
        permalink: post.thread_permalink,
        publishedAt: post.published_at,
        views: snapshot?.views ?? 0,
        likes: snapshot?.likes ?? 0,
        replies: snapshot?.replies ?? 0,
        reposts: snapshot?.reposts ?? 0,
        quotes: snapshot?.quotes ?? 0,
        engagement
      };
    });
    const topPosts = [...latestPosts]
      .sort((left, right) => right.views - left.views)
      .slice(0, 5);

    const categoryMap = new Map<
      string,
      {
        category: string;
        postCount: number;
        materialCount: number;
        totalViews: number;
        totalEngagement: number;
      }
    >();

    for (const post of latestPosts) {
      const category = post.category ?? "uncategorized";
      const existing = categoryMap.get(category) ?? {
        category,
        postCount: 0,
        materialCount: 0,
        totalViews: 0,
        totalEngagement: 0
      };

      existing.postCount += 1;
      existing.totalViews += post.views;
      existing.totalEngagement += post.engagement;
      categoryMap.set(category, existing);
    }

    const supabase = createSupabaseAdminClient();
    const { data: materialRows, error: materialError } = await supabase
      .from("philip_profiles")
      .select("category");

    if (materialError) {
      throw materialError;
    }

    for (const row of materialRows ?? []) {
      const category =
        typeof row.category === "string" ? row.category : "uncategorized";
      const existing = categoryMap.get(category) ?? {
        category,
        postCount: 0,
        materialCount: 0,
        totalViews: 0,
        totalEngagement: 0
      };

      existing.materialCount += 1;
      categoryMap.set(category, existing);
    }

    const categoryBreakdown = Array.from(categoryMap.values()).sort(
      (left, right) => right.totalViews - left.totalViews
    );
    const recentViewTotal = topPosts.reduce((sum, post) => sum + post.views, 0);
    const recentEngagementTotal = topPosts.reduce(
      (sum, post) => sum + post.engagement,
      0
    );

    return {
      lastSyncedAt:
        latestAccountSnapshot?.created_at ??
        latestPostSnapshots[0]?.created_at ??
        null,
      account: latestAccountSnapshot
        ? {
            views: latestAccountSnapshot.views ?? 0,
            likes: latestAccountSnapshot.likes ?? 0,
            replies: latestAccountSnapshot.replies ?? 0,
            reposts: latestAccountSnapshot.reposts ?? 0,
            quotes: latestAccountSnapshot.quotes ?? 0,
            followersCount: latestAccountSnapshot.followers_count ?? 0
          }
        : null,
      summary: {
        publishedPostCount: publishedPosts.length,
        trackedPostCount: latestPostSnapshots.length,
        recentViewTotal,
        recentEngagementTotal,
        averageEngagementRate:
          recentViewTotal > 0
            ? Number(
                ((recentEngagementTotal / recentViewTotal) * 100).toFixed(1)
              )
            : 0
      },
      latestPosts,
      topPosts,
      categoryBreakdown
    };
  } catch (error) {
    if (isMissingInsightsTableError(error)) {
      const empty = buildEmptyInsightsSummary();
      const publishedPosts = await fetchPublishedPosts(24);

      return {
        ...empty,
        summary: {
          ...empty.summary,
          publishedPostCount: publishedPosts.length
        }
      };
    }

    throw error;
  }
}
