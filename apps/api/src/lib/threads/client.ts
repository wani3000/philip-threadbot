import { env } from "../../config/env";

const threadsApiBaseUrl = "https://graph.threads.net";
const inferredThreadsAuthorizeUrl = "https://threads.net/oauth/authorize";

type ThreadsErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
};

type CreateTextThreadInput = {
  accessToken: string;
  text: string;
  replyToId?: string;
};

export class ThreadsApiError extends Error {
  status: number;
  payload: ThreadsErrorPayload | unknown;

  constructor(status: number, payload: ThreadsErrorPayload | unknown) {
    super(`Threads API request failed: ${status} ${JSON.stringify(payload)}`);
    this.name = "ThreadsApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function parseJsonResponse(response: Response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new ThreadsApiError(response.status, payload);
  }

  return payload;
}

export function getThreadsAuthorizationUrl() {
  if (!env.THREADS_APP_ID || !env.THREADS_REDIRECT_URI) {
    throw new Error(
      "THREADS_APP_ID and THREADS_REDIRECT_URI are required for OAuth start."
    );
  }

  const params = new URLSearchParams({
    client_id: env.THREADS_APP_ID,
    redirect_uri: env.THREADS_REDIRECT_URI,
    scope: "threads_basic,threads_content_publish,threads_manage_insights",
    response_type: "code"
  });

  return `${inferredThreadsAuthorizeUrl}?${params.toString()}`;
}

export async function exchangeCodeForShortLivedToken(code: string) {
  if (
    !env.THREADS_APP_ID ||
    !env.THREADS_APP_SECRET ||
    !env.THREADS_REDIRECT_URI
  ) {
    throw new Error(
      "THREADS_APP_ID, THREADS_APP_SECRET, and THREADS_REDIRECT_URI are required."
    );
  }

  const params = new URLSearchParams({
    client_id: env.THREADS_APP_ID,
    client_secret: env.THREADS_APP_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.THREADS_REDIRECT_URI
  });

  const response = await fetch(`${threadsApiBaseUrl}/oauth/access_token`, {
    signal: AbortSignal.timeout(15_000),
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  return parseJsonResponse(response);
}

export async function exchangeLongLivedToken(shortLivedToken: string) {
  if (!env.THREADS_APP_SECRET) {
    throw new Error("THREADS_APP_SECRET is required.");
  }

  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: env.THREADS_APP_SECRET
  });

  const response = await fetch(
    `${threadsApiBaseUrl}/access_token?${params.toString()}`,
    {
      signal: AbortSignal.timeout(15_000),
      method: "GET",
      headers: {
        Authorization: `Bearer ${shortLivedToken}`
      }
    }
  );

  return parseJsonResponse(response);
}

export async function createTextThread({
  accessToken,
  text,
  replyToId
}: CreateTextThreadInput) {
  const params = new URLSearchParams({
    media_type: "TEXT",
    text
  });

  if (replyToId) {
    params.set("reply_to_id", replyToId);
  }

  const response = await fetch(`${threadsApiBaseUrl}/me/threads`, {
    signal: AbortSignal.timeout(15_000),
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  return parseJsonResponse(response);
}

export async function publishThread({
  accessToken,
  creationId
}: {
  accessToken: string;
  creationId: string;
}) {
  const params = new URLSearchParams({
    creation_id: creationId
  });

  const response = await fetch(`${threadsApiBaseUrl}/me/threads_publish`, {
    signal: AbortSignal.timeout(15_000),
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  return parseJsonResponse(response);
}

export async function getThreadDetails({
  accessToken,
  threadId
}: {
  accessToken: string;
  threadId: string;
}) {
  const params = new URLSearchParams({
    fields: "id,permalink,shortcode,text,timestamp,username"
  });

  const response = await fetch(
    `${threadsApiBaseUrl}/${threadId}?${params.toString()}`,
    {
      signal: AbortSignal.timeout(15_000),
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return parseJsonResponse(response);
}

export async function getCurrentThreadsUser(accessToken: string) {
  const params = new URLSearchParams({
    fields: "id,username,threads_profile_picture_url"
  });

  const response = await fetch(`${threadsApiBaseUrl}/me?${params.toString()}`, {
    signal: AbortSignal.timeout(15_000),
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return parseJsonResponse(response);
}

function buildMetricUrl(path: string, metrics: string[]) {
  const params = new URLSearchParams({
    metric: metrics.join(",")
  });

  return `${threadsApiBaseUrl}/${path}?${params.toString()}`;
}

export async function getThreadsUserInsights(
  accessToken: string,
  metrics = [
    "views",
    "likes",
    "replies",
    "reposts",
    "quotes",
    "followers_count"
  ]
) {
  const response = await fetch(buildMetricUrl("me/threads_insights", metrics), {
    signal: AbortSignal.timeout(15_000),
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return parseJsonResponse(response);
}

export async function getThreadsMediaInsights({
  accessToken,
  threadId,
  metrics = ["views", "likes", "replies", "reposts", "quotes"]
}: {
  accessToken: string;
  threadId: string;
  metrics?: string[];
}) {
  const response = await fetch(
    buildMetricUrl(`${threadId}/insights`, metrics),
    {
      signal: AbortSignal.timeout(15_000),
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return parseJsonResponse(response);
}
