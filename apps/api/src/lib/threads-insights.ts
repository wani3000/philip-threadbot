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
    .select("id, thread_id, thread_permalink, published_at, source_snapshot")
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
      if (!post.thread_id) {
        continue;
      }

      try {
        const payload = await getThreadsMediaInsights({
          accessToken: env.THREADS_ACCESS_TOKEN,
          threadId: post.thread_id
        });
        postSnapshots.push({
          postId: post.id,
          threadsMediaId: post.thread_id,
          metrics: normalizeInsightMetrics(payload),
          rawPayload: payload as Record<string, unknown>
        });
      } catch (error) {
        if (isUnsupportedThreadsMediaError(error)) {
          logger.warn("threads.insights.post_skipped", {
            postId: post.id,
            threadId: post.thread_id,
            reason: "unsupported_media_lookup"
          });
          continue;
        }

        throw error;
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
