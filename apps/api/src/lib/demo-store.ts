import { randomUUID } from "node:crypto";
import { JobType } from "./jobs/types";
import {
  DraftPipelineInput,
  ProfileMaterialRecord
} from "./draft-pipeline/types";
import { serializeThreadSegments } from "./thread-content";

type DemoAiSettings = {
  id: string;
  default_provider: string;
  default_model: string;
  custom_system_prompt: string | null;
  tone_settings: Record<string, unknown>;
  telegram_chat_id: string;
  telegram_send_time: string;
  default_post_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

type DemoPostStatus =
  | "draft"
  | "approved"
  | "scheduled"
  | "published"
  | "failed"
  | "cancelled";

type DemoPost = {
  id: string;
  profile_id: string | null;
  source_snapshot: Record<string, unknown>;
  raw_content: string | null;
  generated_content: string;
  edited_content: string | null;
  ai_provider: string;
  ai_model: string;
  status: DemoPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  publish_status: "pending" | "sent_to_threads" | "published" | "failed";
  thread_id: string | null;
  thread_permalink: string | null;
  generation_notes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type DemoJobRun = {
  id: string;
  job_type: JobType;
  status: "queued" | "running" | "succeeded" | "failed";
  run_key: string;
  started_at: string | null;
  finished_at: string | null;
  context: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
};

export type DemoAuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: "admin" | "system";
  actor_identifier: string;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type DemoAccountInsightSnapshot = {
  id: string;
  threads_user_id: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  followers_count: number;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

type DemoPostInsightSnapshot = {
  id: string;
  post_id: string;
  threads_media_id: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  raw_payload: Record<string, unknown>;
  created_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

function tomorrowAt(hours: number, minutes: number) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

const demoMaterials: ProfileMaterialRecord[] = [
  {
    id: "demo-material-1",
    category: "career",
    title: "웁살라시큐리티 합류와 블록체인 커리어 전환",
    content:
      "대학교를 졸업하고 블록체인이 뭔지도 잘 모르던 시기에 싱가포르 블록체인 스타트업 웁살라시큐리티에 첫 디자이너로 합류했습니다. 이후 40명 규모로 성장하는 과정에서 UX 리드를 맡았고, 경찰청, 카카오, 삼성전자, 인터폴이 쓰는 AML 제품 경험을 설계했습니다.",
    tags: ["웁살라시큐리티", "블록체인", "핀테크", "싱가포르"],
    priority: "high",
    used_count: 4,
    last_used_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    is_active: true
  },
  {
    id: "demo-material-2",
    category: "project",
    title: "암호화폐 트래킹 툴 정보구조 개선",
    content:
      "암호화폐 트랜잭션을 수사관이 수동으로 추적하던 상황에서, 신고 800건과 피해금액 2400억 규모 데이터를 빠르게 읽어야 했습니다. 경찰청, 카카오, 삼성전자에서 활용할 수 있도록 정보 구조와 시각화 흐름을 설계했습니다.",
    tags: ["UX디자인", "블록체인", "데이터시각화", "디자이너"],
    priority: "high",
    used_count: 3,
    last_used_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    is_active: true
  },
  {
    id: "demo-material-3",
    category: "startup_story",
    title: "두닷두 창업 실패에서 배운 하드웨어 제약",
    content:
      "홍익대 재학 중 호텔 관리용 스마트워치 서비스를 창업해 미국 샌디에고 호텔 현장까지 가서 테스트했습니다. 투자와 MOU를 만들었지만, 스마트워치 배터리가 1~2시간 만에 닳는 물리적 한계를 간과해 결국 실패했습니다.",
    tags: ["창업실패", "스마트워치", "호텔관리", "서비스설계"],
    priority: "medium",
    used_count: 2,
    last_used_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    is_active: true
  },
  {
    id: "demo-material-4",
    category: "teaching_mentoring",
    title: "Apple Developer Academy 포트폴리오 강연",
    content:
      "Apple Developer Academy와 대학 특강에서 프로덕트 디자이너 커리어, 포트폴리오, UX 실무를 강의했습니다. 실무 프로젝트에서 겪은 시행착오를 커리큘럼으로 바꿨고, 초보 디자이너가 막히는 지점을 예시 중심으로 풀어냈습니다.",
    tags: ["강의", "멘토링", "AppleDeveloperAcademy", "포트폴리오"],
    priority: "medium",
    used_count: 1,
    last_used_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    is_active: true
  },
  {
    id: "demo-material-5",
    category: "designer_insight",
    title: "포트폴리오보다 결과물이 먼저 읽힌다",
    content:
      "학교 프로젝트였던 Florence 모바일 EMR을 제대로 밀어붙였더니 삼성서울병원 디지털헬스케어연구센터에서 직접 구현 문의가 왔습니다. 디자이너 취업 준비에서도 결국 중요한 건 예쁜 정리가 아니라 왜 만들었고 어떤 결과를 냈는지입니다.",
    tags: ["디자이너취업", "포트폴리오", "커리어조언", "UX리서치"],
    priority: "high",
    used_count: 0,
    last_used_at: null,
    is_active: true
  },
  {
    id: "demo-material-6",
    category: "vibe_coding",
    title: "디자이너의 바이브코딩 랜딩페이지 제작 경험",
    content:
      "Claude Code, Cursor, Replit을 실무에 적용하면서 Figma 시안을 실제 웹사이트로 빠르게 옮기는 방식을 만들었습니다. 한화생명 PLUS Pi 랜딩페이지 HTML 컴포넌트와 개인 프로젝트들을 통해 기획-디자인-구현 사이 핸드오프 비용을 줄였습니다.",
    tags: ["바이브코딩", "ClaudeCode", "Cursor", "랜딩페이지수주"],
    priority: "medium",
    used_count: 0,
    last_used_at: null,
    is_active: true
  }
];

const demoPosts: DemoPost[] = [
  {
    id: "demo-post-1",
    profile_id: "demo-material-2",
    source_snapshot: {
      title: "암호화폐 트래킹 툴 정보구조 개선",
      category: "project",
      tags: ["UX디자인", "블록체인", "데이터시각화", "디자이너"]
    },
    raw_content: demoMaterials[1].content,
    generated_content: serializeThreadSegments([
      "수백 개의 트랜잭션을 한 줄씩 뒤지던 장면이 먼저 떠오릅니다.\n\n문제는 데이터 부족이 아니라 구조 부재였습니다.",
      "제가 직접 정보 계층을 다시 그렸을 때, 수사 흐름은 미로에서 지도처럼 바뀌었습니다.",
      "그 결과 신고 800건, 2400억 규모의 흐름을 더 빠르게 읽을 수 있는 툴이 됐습니다.\n\n#UX디자인 #블록체인 #데이터시각화 #디자이너"
    ]),
    edited_content: null,
    ai_provider: "anthropic",
    ai_model: "claude-sonnet-4-6",
    status: "scheduled",
    scheduled_at: tomorrowAt(9, 0),
    published_at: null,
    publish_status: "pending",
    thread_id: null,
    thread_permalink: null,
    generation_notes: {
      title: demoMaterials[1].title,
      tags: demoMaterials[1].tags,
      thread_segments: [
        "수백 개의 트랜잭션을 한 줄씩 뒤지던 장면이 먼저 떠오릅니다.\n\n문제는 데이터 부족이 아니라 구조 부재였습니다.",
        "제가 직접 정보 계층을 다시 그렸을 때, 수사 흐름은 미로에서 지도처럼 바뀌었습니다.",
        "그 결과 신고 800건, 2400억 규모의 흐름을 더 빠르게 읽을 수 있는 툴이 됐습니다.\n\n#UX디자인 #블록체인 #데이터시각화 #디자이너"
      ]
    },
    created_at: nowIso(),
    updated_at: nowIso()
  }
];

const demoSettings: DemoAiSettings = {
  id: "demo-ai-settings",
  default_provider: "anthropic",
  default_model: "claude-sonnet-4-6",
  custom_system_prompt: null,
  tone_settings: {},
  telegram_chat_id: "demo-chat",
  telegram_send_time: "07:00:00",
  default_post_time: "09:00:00",
  timezone: "Asia/Seoul",
  created_at: nowIso(),
  updated_at: nowIso()
};

const state = {
  materials: demoMaterials,
  posts: demoPosts,
  settings: demoSettings,
  jobRuns: [] as DemoJobRun[],
  auditLogs: [] as DemoAuditLog[],
  accountInsightSnapshots: [
    {
      id: randomUUID(),
      threads_user_id: "demo-threads-user",
      views: 18240,
      likes: 524,
      replies: 41,
      reposts: 19,
      quotes: 8,
      followers_count: 1284,
      raw_payload: {},
      created_at: nowIso()
    }
  ] as DemoAccountInsightSnapshot[],
  postInsightSnapshots: [
    {
      id: randomUUID(),
      post_id: "demo-post-1",
      threads_media_id: "demo-thread-1",
      views: 3640,
      likes: 138,
      replies: 12,
      reposts: 9,
      quotes: 3,
      raw_payload: {},
      created_at: nowIso()
    }
  ] as DemoPostInsightSnapshot[]
};

function scorePriority(priority: ProfileMaterialRecord["priority"]) {
  return {
    high: 0,
    medium: 1,
    low: 2
  }[priority];
}

export function listDemoProfileMaterials(input?: {
  category?: string;
  activeOnly?: boolean;
}) {
  let items = [...state.materials];

  if (input?.category) {
    items = items.filter((item) => item.category === input.category);
  }

  if (input?.activeOnly) {
    items = items.filter((item) => item.is_active);
  }

  return items.sort((left, right) =>
    (right.last_used_at ?? "").localeCompare(left.last_used_at ?? "")
  );
}

export function createDemoProfileMaterial(
  input: Pick<
    ProfileMaterialRecord,
    "category" | "title" | "content" | "tags" | "priority" | "is_active"
  >
) {
  const item: ProfileMaterialRecord & {
    created_at?: string;
    updated_at?: string;
  } = {
    id: randomUUID(),
    used_count: 0,
    last_used_at: null,
    ...input
  };

  state.materials.unshift(item);
  return item;
}

export function updateDemoProfileMaterial(
  id: string,
  input: Partial<
    Pick<
      ProfileMaterialRecord,
      "category" | "title" | "content" | "tags" | "priority" | "is_active"
    >
  >
) {
  const item = state.materials.find((entry) => entry.id === id);

  if (!item) {
    throw new Error("원재료를 찾을 수 없습니다.");
  }

  Object.assign(item, input);

  return item;
}

export function deleteDemoProfileMaterial(id: string) {
  const index = state.materials.findIndex((entry) => entry.id === id);

  if (index === -1) {
    throw new Error("원재료를 찾을 수 없습니다.");
  }

  state.materials.splice(index, 1);
}

export function getDemoAiSettings() {
  return state.settings;
}

export function upsertDemoAiSettings(input: Partial<DemoAiSettings>) {
  Object.assign(state.settings, input, {
    updated_at: nowIso()
  });

  return state.settings;
}

export function selectDemoProfileMaterial(input: DraftPipelineInput) {
  let materials = state.materials.filter((item) => item.is_active);

  if (input.profileId) {
    materials = materials.filter((item) => item.id === input.profileId);
  }

  if (input.category) {
    materials = materials.filter((item) => item.category === input.category);
  }

  if (materials.length === 0) {
    throw new Error("활성화된 원재료를 찾을 수 없습니다.");
  }

  return [...materials].sort((left, right) => {
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
}

export function markDemoMaterialUsed(profileId: string) {
  const item = state.materials.find((entry) => entry.id === profileId);

  if (!item) {
    throw new Error("원재료를 찾을 수 없습니다.");
  }

  item.used_count += 1;
  item.last_used_at = nowIso();
}

export function createDemoGeneratedDraft(input: {
  material: ProfileMaterialRecord;
  generatedContent: string;
  threadSegments: string[];
  provider: string;
  model: string;
  rawResponse: unknown;
  scheduledAt?: string;
}) {
  const draft: DemoPost = {
    id: randomUUID(),
    profile_id: input.material.id,
    source_snapshot: input.material,
    raw_content: input.material.content,
    generated_content: input.generatedContent,
    edited_content: null,
    ai_provider: input.provider,
    ai_model: input.model,
    status: input.scheduledAt ? "scheduled" : "draft",
    scheduled_at: input.scheduledAt ?? null,
    published_at: null,
    publish_status: "pending",
    thread_id: null,
    thread_permalink: null,
    generation_notes: {
      title: input.material.title,
      tags: input.material.tags,
      thread_segments: input.threadSegments,
      rawResponse: input.rawResponse
    },
    created_at: nowIso(),
    updated_at: nowIso()
  };

  state.posts.unshift(draft);
  return draft;
}

export function listDemoPosts(input?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  let items = [...state.posts];

  if (input?.status) {
    items = items.filter((item) => item.status === input.status);
  }

  if (input?.dateFrom) {
    items = items.filter(
      (item) => !item.scheduled_at || item.scheduled_at >= input.dateFrom!
    );
  }

  if (input?.dateTo) {
    items = items.filter(
      (item) => !item.scheduled_at || item.scheduled_at <= input.dateTo!
    );
  }

  items.sort((left, right) => {
    const scheduledCompare = (left.scheduled_at ?? "").localeCompare(
      right.scheduled_at ?? ""
    );

    if (scheduledCompare !== 0) {
      return scheduledCompare;
    }

    return right.created_at.localeCompare(left.created_at);
  });

  return items.slice(0, input?.limit ?? items.length);
}

export function getDemoPost(id: string) {
  const post = state.posts.find((entry) => entry.id === id);

  if (!post) {
    throw new Error("초안을 찾을 수 없습니다.");
  }

  return post;
}

export function updateDemoPost(
  id: string,
  input: Partial<Pick<DemoPost, "edited_content" | "scheduled_at" | "status">>
) {
  const post = getDemoPost(id);
  Object.assign(post, input, {
    updated_at: nowIso()
  });
  return post;
}

export function duplicateDemoPost(input: {
  postId: string;
  scheduledAt?: string | null;
  status: "draft" | "scheduled";
}) {
  const post = getDemoPost(input.postId);
  const duplicated: DemoPost = {
    ...post,
    id: randomUUID(),
    status: input.status,
    scheduled_at:
      input.status === "scheduled"
        ? (input.scheduledAt ?? post.scheduled_at)
        : null,
    published_at: null,
    publish_status: "pending",
    thread_id: null,
    thread_permalink: null,
    generation_notes: {
      ...post.generation_notes,
      reusedFromPostId: post.id,
      reusedAt: nowIso()
    },
    created_at: nowIso(),
    updated_at: nowIso()
  };

  state.posts.unshift(duplicated);
  return duplicated;
}

export function listDemoDueScheduledPosts(cutoffIso: string) {
  return state.posts.filter(
    (post) =>
      post.status === "scheduled" &&
      post.publish_status === "pending" &&
      Boolean(post.scheduled_at) &&
      (post.scheduled_at ?? "") <= cutoffIso
  );
}

export function markDemoPostPublished(input: {
  id: string;
  threadId: string;
  threadPermalink: string | null;
  publishedAt: string;
}) {
  const post = getDemoPost(input.id);
  post.status = "published";
  post.publish_status = "published";
  post.thread_id = input.threadId;
  post.thread_permalink = input.threadPermalink;
  post.published_at = input.publishedAt;
  post.updated_at = nowIso();
  return post;
}

export function markDemoPostFailed(input: {
  id: string;
  errorMessage: string;
}) {
  const post = getDemoPost(input.id);
  post.status = "failed";
  post.publish_status = "failed";
  post.generation_notes = {
    ...post.generation_notes,
    publishError: input.errorMessage
  };
  post.updated_at = nowIso();
  return post;
}

export function getDemoJobRunByKey(runKey: string) {
  return state.jobRuns.find((entry) => entry.run_key === runKey) ?? null;
}

export function createOrRestartDemoJobRun(jobType: JobType, runKey: string) {
  const existing = getDemoJobRunByKey(runKey);

  if (existing?.status === "succeeded") {
    return {
      runKey,
      status: "already_succeeded" as const
    };
  }

  if (existing) {
    existing.status = "running";
    existing.started_at = nowIso();
    existing.finished_at = null;
    existing.error_message = null;

    return {
      runKey,
      status: "started" as const
    };
  }

  state.jobRuns.unshift({
    id: randomUUID(),
    job_type: jobType,
    status: "running",
    run_key: runKey,
    started_at: nowIso(),
    finished_at: null,
    context: {},
    error_message: null,
    created_at: nowIso()
  });

  return {
    runKey,
    status: "started" as const
  };
}

export function markDemoJobRunSucceeded(runKey: string) {
  const run = getDemoJobRunByKey(runKey);

  if (!run) {
    throw new Error("작업 실행 기록을 찾을 수 없습니다.");
  }

  run.status = "succeeded";
  run.finished_at = nowIso();
}

export function markDemoJobRunFailed(runKey: string, errorMessage: string) {
  const run = getDemoJobRunByKey(runKey);

  if (!run) {
    throw new Error("작업 실행 기록을 찾을 수 없습니다.");
  }

  run.status = "failed";
  run.error_message = errorMessage;
  run.finished_at = nowIso();
}

export function appendDemoAuditLog(
  input: Omit<DemoAuditLog, "id" | "created_at">
) {
  const entry: DemoAuditLog = {
    id: randomUUID(),
    created_at: nowIso(),
    ...input
  };

  state.auditLogs.unshift(entry);
  return entry;
}

export function listDemoAuditLogs(limit = 20) {
  return state.auditLogs.slice(0, limit);
}

export function syncDemoThreadsInsights() {
  const createdAt = nowIso();
  const latestAccount = state.accountInsightSnapshots[0];
  const nextAccount = {
    ...latestAccount,
    id: randomUUID(),
    views: latestAccount.views + 180,
    likes: latestAccount.likes + 6,
    replies: latestAccount.replies + 1,
    reposts: latestAccount.reposts,
    followers_count: latestAccount.followers_count + 2,
    created_at: createdAt
  };

  state.accountInsightSnapshots.unshift(nextAccount);

  const newPostSnapshots = state.posts
    .filter((post) => post.status === "published" || post.id === "demo-post-1")
    .slice(0, 8)
    .map((post, index) => ({
      id: randomUUID(),
      post_id: post.id,
      threads_media_id: post.thread_id ?? `demo-thread-${index + 1}`,
      views: 1200 + index * 180,
      likes: 42 + index * 7,
      replies: 4 + index,
      reposts: 2 + Math.floor(index / 2),
      quotes: 1 + Math.floor(index / 3),
      raw_payload: {},
      created_at: createdAt
    }));

  state.postInsightSnapshots.unshift(...newPostSnapshots);

  return {
    syncedAt: createdAt,
    syncedAccount: true,
    syncedPosts: newPostSnapshots.length
  };
}

export function getDemoThreadsInsightsSummary() {
  const latestAccount = state.accountInsightSnapshots[0] ?? null;
  const latestPostById = new Map<string, DemoPostInsightSnapshot>();

  for (const snapshot of state.postInsightSnapshots) {
    if (!latestPostById.has(snapshot.post_id)) {
      latestPostById.set(snapshot.post_id, snapshot);
    }
  }

  const publishedPosts = state.posts.filter(
    (post) => post.status === "published" || post.status === "scheduled"
  );
  const latestPosts = publishedPosts.map((post) => {
    const snapshot = latestPostById.get(post.id);
    const engagement =
      (snapshot?.likes ?? 0) +
      (snapshot?.replies ?? 0) +
      (snapshot?.reposts ?? 0) +
      (snapshot?.quotes ?? 0);

    return {
      postId: post.id,
      title: String(post.source_snapshot.title ?? "제목 없음"),
      category:
        typeof post.source_snapshot.category === "string"
          ? post.source_snapshot.category
          : null,
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

  for (const material of state.materials) {
    const existing = categoryMap.get(material.category) ?? {
      category: material.category,
      postCount: 0,
      materialCount: 0,
      totalViews: 0,
      totalEngagement: 0
    };

    existing.materialCount += 1;
    categoryMap.set(material.category, existing);
  }

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

  const recentViewTotal = topPosts.reduce((sum, post) => sum + post.views, 0);
  const recentEngagementTotal = topPosts.reduce(
    (sum, post) => sum + post.engagement,
    0
  );

  return {
    lastSyncedAt:
      latestAccount?.created_at ??
      state.postInsightSnapshots[0]?.created_at ??
      null,
    account: latestAccount
      ? {
          views: latestAccount.views,
          likes: latestAccount.likes,
          replies: latestAccount.replies,
          reposts: latestAccount.reposts,
          quotes: latestAccount.quotes,
          followersCount: latestAccount.followers_count
        }
      : null,
    summary: {
      publishedPostCount: publishedPosts.length,
      trackedPostCount: latestPosts.length,
      recentViewTotal,
      recentEngagementTotal,
      averageEngagementRate:
        recentViewTotal > 0
          ? Number(((recentEngagementTotal / recentViewTotal) * 100).toFixed(1))
          : 0
    },
    latestPosts,
    topPosts,
    categoryBreakdown: Array.from(categoryMap.values()).sort(
      (left, right) => right.totalViews - left.totalViews
    )
  };
}
