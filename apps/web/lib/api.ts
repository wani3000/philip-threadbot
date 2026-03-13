import "server-only";

import { getAdminAccessToken } from "./admin";

export type ProfileMaterial = {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  priority: "high" | "medium" | "low";
  is_active: boolean;
  used_count: number;
  last_used_at: string | null;
  updated_at: string;
};

export type PostRecord = {
  id: string;
  profile_id: string | null;
  generated_content: string;
  edited_content: string | null;
  ai_provider: string;
  ai_model: string;
  status:
    | "draft"
    | "approved"
    | "scheduled"
    | "published"
    | "failed"
    | "cancelled";
  scheduled_at: string | null;
  published_at: string | null;
  thread_permalink: string | null;
  created_at: string;
  source_snapshot?: {
    title?: string;
    category?: string;
    tags?: string[];
  };
};

export type AiSettings = {
  id: string;
  default_provider: string;
  default_model: string;
  custom_system_prompt: string | null;
  telegram_chat_id: string;
  telegram_send_time: string;
  default_post_time: string;
  timezone: string;
};

export type AuditLogRecord = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_type: string;
  actor_identifier: string;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ThreadsStatus = {
  connectionStatus:
    | "connected"
    | "configuration_required"
    | "token_missing"
    | "error";
  message: string | null;
  oauthConfigured: boolean;
  accessTokenConfigured: boolean;
  userIdConfigured: boolean;
  appId: string | null;
  redirectUri: string | null;
  configuredUserId: string | null;
  authorizeUrl: string | null;
  profile: {
    id: string;
    username: string;
    threads_profile_picture_url?: string;
  } | null;
  profileUrl: string | null;
};

export type OperationalReadiness = {
  mode: "demo" | "live";
  overallStatus: "ready" | "warning" | "blocked";
  summary: {
    ready: number;
    warning: number;
    blocked: number;
  };
  checks: Array<{
    key: string;
    label: string;
    status: "ready" | "warning" | "blocked";
    message: string;
    details?: string[];
  }>;
};

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
};

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (!options.skipAuth) {
    const accessToken = await getAdminAccessToken();
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "API request failed.");
  }

  return payload as T;
}

export async function fetchProfileMaterials() {
  const payload = await apiRequest<{ items: ProfileMaterial[] }>(
    "/api/profile-materials"
  );

  return payload.items;
}

export async function fetchPosts(params?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set("status", params.status);
  if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
  if (params?.dateTo) searchParams.set("dateTo", params.dateTo);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const suffix = searchParams.size ? `?${searchParams.toString()}` : "";
  const payload = await apiRequest<{ items: PostRecord[] }>(
    `/api/posts${suffix}`
  );

  return payload.items;
}

export async function fetchAiSettings() {
  return apiRequest<AiSettings>("/api/ai-settings");
}

export async function fetchAuditLogs(limit = 8) {
  const payload = await apiRequest<{ items: AuditLogRecord[] }>(
    `/api/audit-logs?limit=${limit}`
  );

  return payload.items;
}

export async function fetchThreadsStatus() {
  return apiRequest<ThreadsStatus>("/integrations/threads/status");
}

export async function fetchOperationalReadiness() {
  return apiRequest<OperationalReadiness>("/admin/readiness");
}

export async function updateAiSettings(input: {
  defaultProvider: string;
  defaultModel: string;
  customSystemPrompt?: string;
  telegramChatId: string;
  telegramSendTime: string;
  defaultPostTime: string;
  timezone: string;
}) {
  return apiRequest<AiSettings>("/api/ai-settings", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export async function createProfileMaterial(input: {
  category: string;
  title: string;
  content: string;
  tags: string[];
  priority: string;
  isActive: boolean;
}) {
  return apiRequest<ProfileMaterial>("/api/profile-materials", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updateProfileMaterial(
  id: string,
  input: Partial<{
    category: string;
    title: string;
    content: string;
    tags: string[];
    priority: string;
    isActive: boolean;
  }>
) {
  return apiRequest<ProfileMaterial>(`/api/profile-materials/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function deleteProfileMaterial(id: string) {
  return apiRequest<void>(`/api/profile-materials/${id}`, {
    method: "DELETE"
  });
}

export async function generateDraft(input: {
  profileId?: string;
  category?: string;
  provider?: string;
  model?: string;
  scheduledAt?: string;
}) {
  return apiRequest("/api/drafts/generate", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function updatePost(
  id: string,
  input: Partial<{
    editedContent: string;
    scheduledAt: string | null;
    status: string;
  }>
) {
  return apiRequest<PostRecord>(`/api/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export async function regeneratePost(
  id: string,
  input?: { provider?: string; model?: string }
) {
  return apiRequest(`/api/posts/${id}/regenerate`, {
    method: "POST",
    body: JSON.stringify(input ?? {})
  });
}
