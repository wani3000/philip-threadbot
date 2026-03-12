import { randomUUID } from "node:crypto";
import { JobType } from "./jobs/types";
import {
  DraftPipelineInput,
  ProfileMaterialRecord
} from "./draft-pipeline/types";

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
    id: "demo-material-2",
    category: "teaching",
    title: "비전공자 대상 UX 강의",
    content:
      "비전공 수강생 120명을 대상으로 Figma와 UX 리서치 기초를 가르쳤고, 실습 중심 커리큘럼으로 완주율을 높였습니다. 막히는 지점을 수업 구조로 풀었던 경험이 있습니다.",
    tags: ["UX강의", "Figma", "디자인교육"],
    priority: "medium",
    used_count: 1,
    last_used_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    is_active: true
  },
  {
    id: "demo-material-3",
    category: "vibe_coding",
    title: "바이브코딩으로 빠르게 랜딩페이지 제작",
    content:
      "짧은 기간 안에 바이브코딩 방식으로 웹사이트를 만들면서, 디자이너가 구조를 잡고 개발 속도를 높이는 협업 방식을 실험했습니다. 기획-디자인-구현의 핸드오프 비용이 크게 줄었습니다.",
    tags: ["바이브코딩", "랜딩페이지", "프로덕트디자인"],
    priority: "medium",
    used_count: 0,
    last_used_at: null,
    is_active: true
  }
];

const demoPosts: DemoPost[] = [
  {
    id: "demo-post-1",
    profile_id: "demo-material-1",
    source_snapshot: {
      title: "암호화폐 트래킹 툴 정보구조 개선",
      category: "project",
      tags: ["UX디자인", "블록체인", "데이터시각화", "디자이너"]
    },
    raw_content: demoMaterials[0].content,
    generated_content:
      "수백 개의 트랜잭션을 한 줄씩 뒤지던 장면이 먼저 떠오릅니다.\n\n문제는 데이터 부족이 아니라 구조 부재였습니다. 제가 직접 정보 계층을 다시 그렸을 때, 수사 흐름은 미로에서 지도처럼 바뀌었습니다.\n\n그 결과 신고 800건, 2400억 규모의 흐름을 더 빠르게 읽을 수 있는 툴이 됐습니다.\n\n#UX디자인 #블록체인 #데이터시각화 #디자이너",
    edited_content: null,
    ai_provider: "anthropic",
    ai_model: "claude-3-7-sonnet-latest",
    status: "scheduled",
    scheduled_at: tomorrowAt(9, 0),
    published_at: null,
    publish_status: "pending",
    thread_id: null,
    thread_permalink: null,
    generation_notes: {
      title: demoMaterials[0].title,
      tags: demoMaterials[0].tags
    },
    created_at: nowIso(),
    updated_at: nowIso()
  }
];

const demoSettings: DemoAiSettings = {
  id: "demo-ai-settings",
  default_provider: "anthropic",
  default_model: "claude-3-7-sonnet-latest",
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
  auditLogs: [] as DemoAuditLog[]
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
