import { env } from "../../config/env";

const threadsApiBaseUrl = "https://graph.threads.net";
const inferredThreadsAuthorizeUrl = "https://threads.net/oauth/authorize";

type CreateTextThreadInput = {
  accessToken: string;
  text: string;
};

async function parseJsonResponse(response: Response) {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      `Threads API request failed: ${response.status} ${JSON.stringify(payload)}`
    );
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
  text
}: CreateTextThreadInput) {
  const params = new URLSearchParams({
    media_type: "TEXT",
    text
  });

  const response = await fetch(`${threadsApiBaseUrl}/me/threads`, {
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
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  return parseJsonResponse(response);
}

