import { env } from "../../config/env";
import { createSupabaseAdminClient, hasSupabaseAuthConfig } from "../supabase";
import {
  getDemoAiSettings,
  listDemoDueScheduledPosts,
  listDemoPosts,
  markDemoJobRunSucceeded,
  markDemoPostFailed,
  markDemoPostPublished
} from "../demo-store";
import { logger } from "../logger";
import { isDemoModeEnabled } from "../runtime";
import { recordAuditEvent } from "../audit";
import { generateDraftFromProfile } from "../draft-pipeline";
import { getDefaultAiSettings } from "../draft-pipeline/store";
import { resolvePostThreadSegments } from "../thread-content";
import { sendTelegramMessage } from "../telegram/client";
import { renderDraftPreviewMessage } from "../telegram/templates";
import {
  createTextThread,
  getThreadDetails,
  publishThread,
  ThreadsApiError
} from "../threads/client";
import { createOrRestartJobRun, markJobRunFailed } from "./store";
import { JobExecutionResult, JobType } from "./types";

type StoredPostRecord = {
  id: string;
  generated_content: string;
  edited_content: string | null;
  status:
    | "draft"
    | "approved"
    | "scheduled"
    | "published"
    | "failed"
    | "cancelled";
  publish_status: "pending" | "sent_to_threads" | "published" | "failed";
  scheduled_at: string | null;
  ai_model: string;
  source_snapshot: {
    category?: string;
  } | null;
  generation_notes: {
    thread_segments?: string[];
  } | null;
};

const storedPostSelect =
  "id, generated_content, edited_content, status, publish_status, scheduled_at, ai_model, source_snapshot, generation_notes";

function buildRunKey(jobType: JobType, dateInput?: string) {
  const date = dateInput ? new Date(dateInput) : new Date();

  const formattedDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: env.TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  return `${jobType}:${formattedDate}`;
}

function parseTimeValue(value: string) {
  const [hour = "09", minute = "00", second = "00"] = value.split(":");
  return {
    hour: Number.parseInt(hour, 10),
    minute: Number.parseInt(minute, 10),
    second: Number.parseInt(second, 10)
  };
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "longOffset"
  });

  const parts = formatter.formatToParts(date);
  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number.parseInt(read("year"), 10),
    month: Number.parseInt(read("month"), 10),
    day: Number.parseInt(read("day"), 10),
    hour: Number.parseInt(read("hour"), 10),
    minute: Number.parseInt(read("minute"), 10),
    second: Number.parseInt(read("second"), 10),
    offsetLabel: read("timeZoneName")
  };
}

function getOffsetMinutes(date: Date, timeZone: string) {
  const { offsetLabel } = getTimeZoneParts(date, timeZone);
  const matched = offsetLabel.match(/GMT([+-])(\d{2}):?(\d{2})/u);

  if (!matched) {
    return 0;
  }

  const [, sign, hours, minutes] = matched;
  const absoluteMinutes =
    Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);

  return sign === "-" ? -absoluteMinutes : absoluteMinutes;
}

function toUtcFromTimeZone(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timeZone: string;
}) {
  const utcGuess = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second
  );
  const offsetMinutes = getOffsetMinutes(new Date(utcGuess), input.timeZone);

  return new Date(utcGuess - offsetMinutes * 60_000);
}

function addDaysToDateParts(
  input: { year: number; month: number; day: number },
  dayOffset: number
) {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day));
  date.setUTCDate(date.getUTCDate() + dayOffset);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

function buildScheduledAtIso(input?: {
  baseDate?: string;
  dayOffset?: number;
  time?: string;
  timeZone?: string;
}) {
  const timeZone = input?.timeZone ?? env.TIMEZONE;
  const baseDate = input?.baseDate ? new Date(input.baseDate) : new Date();
  const dayOffset = input?.dayOffset ?? 0;
  const { year, month, day } = addDaysToDateParts(
    getTimeZoneParts(baseDate, timeZone),
    dayOffset
  );
  const timeValue = parseTimeValue(input?.time ?? "09:00:00");

  return toUtcFromTimeZone({
    year,
    month,
    day,
    hour: timeValue.hour,
    minute: timeValue.minute,
    second: timeValue.second,
    timeZone
  }).toISOString();
}

function buildDateKey(input: {
  date: string;
  timeZone: string;
  dayOffset?: number;
}) {
  const localParts = getTimeZoneParts(new Date(input.date), input.timeZone);
  const target = addDaysToDateParts(localParts, input.dayOffset ?? 0);
  const month = String(target.month).padStart(2, "0");
  const day = String(target.day).padStart(2, "0");

  return `${target.year}-${month}-${day}`;
}

function getPostThreadSegments(post: StoredPostRecord) {
  return resolvePostThreadSegments({
    editedContent: post.edited_content,
    generatedContent: post.generated_content,
    generationNotes: post.generation_notes
  });
}

function getPostCategory(post: StoredPostRecord) {
  const category = post.source_snapshot?.category;
  return typeof category === "string" ? category : undefined;
}

async function markJobRunSucceeded(runKey: string) {
  if (isDemoModeEnabled()) {
    markDemoJobRunSucceeded(runKey);
    return;
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("job_runs")
    .update({
      status: "succeeded",
      finished_at: new Date().toISOString()
    })
    .eq("run_key", runKey);

  if (error) {
    throw error;
  }
}

async function fetchDueScheduledPosts(cutoffIso: string) {
  if (isDemoModeEnabled()) {
    return listDemoDueScheduledPosts(cutoffIso);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("posts")
    .select(storedPostSelect)
    .eq("status", "scheduled")
    .eq("publish_status", "pending")
    .lte("scheduled_at", cutoffIso)
    .order("scheduled_at", { ascending: true })
    .returns<StoredPostRecord[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function fetchTomorrowPreviewPosts(baseDate?: string) {
  const settings = isDemoModeEnabled()
    ? getDemoAiSettings()
    : await getDefaultAiSettings();
  const timeZone = settings?.timezone ?? env.TIMEZONE;
  const targetDateKey = buildDateKey({
    date: baseDate ?? new Date().toISOString(),
    timeZone,
    dayOffset: 1
  });

  const posts = isDemoModeEnabled()
    ? listDemoPosts({
        status: "scheduled",
        limit: 20
      })
    : await (async () => {
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
          .from("posts")
          .select(storedPostSelect)
          .eq("status", "scheduled")
          .order("scheduled_at", { ascending: true })
          .limit(20)
          .returns<StoredPostRecord[]>();

        if (error) {
          throw error;
        }

        return data ?? [];
      })();

  return {
    settings,
    items: posts.filter((post) => {
      if (!post.scheduled_at) {
        return false;
      }

      return (
        buildDateKey({
          date: post.scheduled_at,
          timeZone
        }) === targetDateKey
      );
    })
  };
}

async function updatePublishedPost(input: {
  id: string;
  threadId: string;
  threadPermalink: string | null;
}) {
  const publishedAt = new Date().toISOString();

  if (isDemoModeEnabled()) {
    markDemoPostPublished({
      id: input.id,
      threadId: input.threadId,
      threadPermalink: input.threadPermalink,
      publishedAt
    });
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "published",
      publish_status: "published",
      thread_id: input.threadId,
      thread_permalink: input.threadPermalink,
      published_at: publishedAt
    })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}

async function updatePartialPublishedPost(input: {
  id: string;
  threadId: string;
  threadPermalink: string | null;
}) {
  if (isDemoModeEnabled()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("posts")
    .update({
      publish_status: "sent_to_threads",
      thread_id: input.threadId,
      thread_permalink: input.threadPermalink
    })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}

async function updateFailedPost(input: { id: string; errorMessage: string }) {
  if (isDemoModeEnabled()) {
    markDemoPostFailed(input);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("posts")
    .select("generation_notes")
    .eq("id", input.id)
    .maybeSingle<{ generation_notes?: Record<string, unknown> | null }>();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "failed",
      publish_status: "failed",
      generation_notes: {
        ...(existing?.generation_notes ?? {}),
        publishError: input.errorMessage
      }
    })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}

async function createPublishAttempt(input: {
  postId: string;
  requestPayload: Record<string, unknown>;
  responsePayload: Record<string, unknown>;
  success: boolean;
  errorMessage?: string;
}) {
  if (isDemoModeEnabled()) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { count, error: countError } = await supabase
    .from("publish_attempts")
    .select("*", { count: "exact", head: true })
    .eq("post_id", input.postId);

  if (countError) {
    throw countError;
  }

  const { error } = await supabase.from("publish_attempts").insert({
    post_id: input.postId,
    attempt_number: (count ?? 0) + 1,
    request_payload: input.requestPayload,
    response_payload: input.responsePayload,
    success: input.success,
    error_message: input.errorMessage ?? null
  });

  if (error) {
    throw error;
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isThreadsMissingResourceError(error: unknown) {
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
    payload.error?.code === 24 &&
    payload.error?.error_subcode === 4279009
  );
}

async function createReplyThreadWithRetry(input: {
  accessToken: string;
  text: string;
  replyToId: string;
}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await createTextThread(input);
    } catch (error) {
      lastError = error;

      if (!isThreadsMissingResourceError(error) || attempt === 5) {
        break;
      }

      await wait(attempt * 1500);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Reply publish failed.");
}

async function publishReplyThreadWithRetry(input: {
  accessToken: string;
  creationId: string;
}) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    if (attempt === 1) {
      await wait(3_000);
    }

    try {
      return await publishThread(input);
    } catch (error) {
      lastError = error;

      if (!isThreadsMissingResourceError(error) || attempt === 4) {
        break;
      }

      await wait(attempt * 2_000);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Reply publish failed.");
}

async function executeGenerateDailyDraft(baseDate?: string) {
  const settings = await getDefaultAiSettings();
  const scheduledAt = buildScheduledAtIso({
    baseDate,
    dayOffset: 1,
    time: settings?.default_post_time ?? "09:00:00",
    timeZone: settings?.timezone ?? env.TIMEZONE
  });

  return generateDraftFromProfile({
    scheduledAt
  });
}

async function executeSendDailyTelegram(baseDate?: string) {
  const { settings, items } = await fetchTomorrowPreviewPosts(baseDate);
  const firstPost = items[0];

  if (!firstPost) {
    logger.info("job.send_daily_telegram.skipped", {
      reason: "no_scheduled_post_for_tomorrow"
    });
    return {
      delivered: false,
      reason: "no_scheduled_post_for_tomorrow"
    };
  }

  const message = renderDraftPreviewMessage({
    scheduledAt: firstPost.scheduled_at ?? undefined,
    aiModel: firstPost.ai_model,
    materialCategory: getPostCategory(firstPost),
    segments: getPostThreadSegments(firstPost),
    dashboardUrl: env.APP_URL
  });

  const telegramResponse = await sendTelegramMessage({
    text: message,
    chatId: settings?.telegram_chat_id
  });

  return {
    delivered: true,
    postId: firstPost.id,
    telegramResponse
  };
}

async function executePublishScheduledPosts(baseDate?: string) {
  const accessToken = env.THREADS_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      "THREADS_ACCESS_TOKEN is required to publish scheduled posts."
    );
  }

  const cutoffIso = baseDate
    ? new Date(baseDate).toISOString()
    : new Date().toISOString();
  const duePosts = await fetchDueScheduledPosts(cutoffIso);
  const results: Array<{
    postId: string;
    status: "published" | "failed";
    threadId?: string;
    permalink?: string | null;
    errorMessage?: string;
  }> = [];

  for (const post of duePosts) {
    const segments = getPostThreadSegments(post);
    let rootPublishSnapshot:
      | {
          container?: Record<string, unknown>;
          publishResult?: Record<string, unknown>;
          details?: Record<string, unknown>;
        }
      | undefined;
    const partialReplyChain: Array<{
      threadId: string;
      permalink?: string | null;
    }> = [];

    if (segments.length === 0) {
      throw new Error("게시할 Threads 세그먼트가 없습니다.");
    }

    try {
      const firstContainer = await createTextThread({
        accessToken,
        text: segments[0]
      });
      const firstPublishResult = await publishThread({
        accessToken,
        creationId: firstContainer.id
      });
      const firstDetails = await getThreadDetails({
        accessToken,
        threadId: firstPublishResult.id
      });
      rootPublishSnapshot = {
        container: firstContainer,
        publishResult: firstPublishResult,
        details: firstDetails
      };
      await updatePartialPublishedPost({
        id: post.id,
        threadId: firstPublishResult.id,
        threadPermalink: firstDetails.permalink ?? null
      });
      const replyChain = [
        {
          threadId: firstPublishResult.id,
          permalink: firstDetails.permalink ?? null
        }
      ];
      partialReplyChain.push(...replyChain);

      let replyToId = firstPublishResult.id;

      for (const segment of segments.slice(1)) {
        const replyContainer = await createReplyThreadWithRetry({
          accessToken,
          text: segment,
          replyToId
        });
        const replyPublishResult = await publishReplyThreadWithRetry({
          accessToken,
          creationId: replyContainer.id
        });
        const replyDetails = await getThreadDetails({
          accessToken,
          threadId: replyPublishResult.id
        });

        replyChain.push({
          threadId: replyPublishResult.id,
          permalink: replyDetails.permalink ?? null
        });
        partialReplyChain.push({
          threadId: replyPublishResult.id,
          permalink: replyDetails.permalink ?? null
        });
        replyToId = replyPublishResult.id;
      }

      await updatePublishedPost({
        id: post.id,
        threadId: firstPublishResult.id,
        threadPermalink: firstDetails.permalink ?? null
      });
      await createPublishAttempt({
        postId: post.id,
        requestPayload: {
          segments,
          scheduledAt: post.scheduled_at
        },
        responsePayload: {
          root: rootPublishSnapshot,
          replyChain
        },
        success: true
      });
      await recordAuditEvent({
        action: "post.published",
        entityType: "post",
        entityId: post.id,
        actorType: "system",
        actorIdentifier: "scheduler",
        metadata: {
          threadId: firstPublishResult.id,
          permalink: firstDetails.permalink ?? null,
          replyCount: Math.max(0, replyChain.length - 1)
        }
      });

      results.push({
        postId: post.id,
        status: "published",
        threadId: firstPublishResult.id,
        permalink: firstDetails.permalink ?? null
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown publish error";

      await updateFailedPost({
        id: post.id,
        errorMessage
      });
      await createPublishAttempt({
        postId: post.id,
        requestPayload: {
          segments,
          scheduledAt: post.scheduled_at
        },
        responsePayload: {
          root: rootPublishSnapshot ?? null,
          replyChain: partialReplyChain
        },
        success: false,
        errorMessage
      });
      await recordAuditEvent({
        action: "post.publish_failed",
        entityType: "post",
        entityId: post.id,
        actorType: "system",
        actorIdentifier: "scheduler",
        metadata: {
          errorMessage
        }
      });

      results.push({
        postId: post.id,
        status: "failed",
        errorMessage
      });
    }
  }

  return {
    cutoffIso,
    totalDuePosts: duePosts.length,
    publishedCount: results.filter((item) => item.status === "published")
      .length,
    failedCount: results.filter((item) => item.status === "failed").length,
    results
  };
}

function assertJobConfig() {
  if (isDemoModeEnabled()) {
    return;
  }

  if (!hasSupabaseAuthConfig || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Job execution requires SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}

export async function runJob(
  jobType: JobType,
  options?: {
    date?: string;
  }
): Promise<JobExecutionResult> {
  assertJobConfig();

  const runKey = buildRunKey(jobType, options?.date);
  const runState = await createOrRestartJobRun(jobType, runKey);

  if (runState.status === "already_succeeded") {
    logger.info("job.skipped", {
      jobType,
      runKey
    });
    return {
      jobType,
      runKey,
      status: "already_succeeded"
    };
  }

  try {
    const result =
      jobType === "generate_daily_draft"
        ? await executeGenerateDailyDraft(options?.date)
        : jobType === "send_daily_telegram"
          ? await executeSendDailyTelegram(options?.date)
          : await executePublishScheduledPosts(options?.date);

    await markJobRunSucceeded(runKey);
    logger.info("job.succeeded", {
      jobType,
      runKey,
      mode: isDemoModeEnabled() ? "demo" : "live",
      result
    });
    await recordAuditEvent({
      action: "job.run",
      entityType: "job_run",
      entityId: runKey,
      actorType: "system",
      actorIdentifier: "scheduler",
      metadata: {
        jobType,
        runKey,
        mode: isDemoModeEnabled() ? "demo" : "live",
        result
      }
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown job execution error";

    await markJobRunFailed(runKey, errorMessage);
    logger.error("job.failed", {
      jobType,
      runKey,
      error: errorMessage
    });
    await recordAuditEvent({
      action: "job.failed",
      entityType: "job_run",
      entityId: runKey,
      actorType: "system",
      actorIdentifier: "scheduler",
      metadata: {
        jobType,
        runKey,
        errorMessage
      }
    });
    throw error;
  }

  return {
    jobType,
    runKey,
    status: "started"
  };
}
