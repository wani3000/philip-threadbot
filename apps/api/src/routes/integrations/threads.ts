import crypto from "node:crypto";
import { Router } from "express";
import { AuthenticatedRequest, requireAdminAuth } from "../../middleware/auth";
import {
  createTextThread,
  exchangeCodeForShortLivedToken,
  exchangeLongLivedToken,
  getCurrentThreadsUser,
  getThreadsAuthorizationUrl,
  publishThread
} from "../../lib/threads/client";
import { env } from "../../config/env";
import { asyncHandler } from "../../lib/http/async-handler";
import { recordAuditEvent } from "../../lib/audit";
import { RequestWithContext } from "../../middleware/request-context";
import {
  getThreadsInsightsSummary,
  syncThreadsInsights
} from "../../lib/threads-insights";

const threadsRouter = Router();

type SignedRequestPayload = {
  algorithm?: string;
  issued_at?: number;
  user_id?: string;
  profile_id?: string;
  [key: string]: unknown;
};

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  return Buffer.from(`${normalized}${padding}`, "base64");
}

function parseSignedRequest(signedRequest?: string | null) {
  if (!signedRequest || !env.THREADS_APP_SECRET) {
    return null;
  }

  const [encodedSignature, encodedPayload] = signedRequest.split(".");

  if (!encodedSignature || !encodedPayload) {
    return null;
  }

  const expectedSignature = toBase64Url(
    crypto
      .createHmac("sha256", env.THREADS_APP_SECRET)
      .update(encodedPayload)
      .digest()
  );

  if (expectedSignature !== encodedSignature) {
    return null;
  }

  const payloadText = fromBase64Url(encodedPayload).toString("utf8");
  return JSON.parse(payloadText) as SignedRequestPayload;
}

function readSignedRequest(request: {
  body?: { signed_request?: unknown };
  query?: { signed_request?: unknown };
}) {
  const bodySignedRequest = request.body?.signed_request;
  const querySignedRequest = request.query?.signed_request;

  if (typeof bodySignedRequest === "string") {
    return bodySignedRequest;
  }

  if (typeof querySignedRequest === "string") {
    return querySignedRequest;
  }

  return null;
}

function getPublicBaseUrl(request: RequestWithContext) {
  if (env.THREADS_REDIRECT_URI) {
    return new URL(env.THREADS_REDIRECT_URI).origin;
  }

  const forwardedProto = request.get("x-forwarded-proto");
  const protocol = forwardedProto ?? request.protocol;
  return `${protocol}://${request.get("host")}`;
}

threadsRouter.get("/oauth/start", (_request, response) => {
  const authorizeUrl = getThreadsAuthorizationUrl();

  response.json({
    authorizeUrl
  });
});

threadsRouter.get(
  "/status",
  requireAdminAuth,
  asyncHandler(async (_request, response) => {
    const hasOauthConfig = Boolean(
      env.THREADS_APP_ID && env.THREADS_APP_SECRET && env.THREADS_REDIRECT_URI
    );
    const hasToken = Boolean(env.THREADS_ACCESS_TOKEN);
    const hasUserId = Boolean(env.THREADS_USER_ID);

    let profile: {
      id: string;
      username: string;
      threads_profile_picture_url?: string;
    } | null = null;
    let connectionStatus:
      | "connected"
      | "configuration_required"
      | "token_missing"
      | "error" = "configuration_required";
    let message: string | null = null;
    let authorizeUrl: string | null = null;

    if (hasOauthConfig) {
      authorizeUrl = getThreadsAuthorizationUrl();
    }

    if (!hasOauthConfig) {
      message = "Threads OAuth 설정값이 아직 완성되지 않았습니다.";
    } else if (!hasToken) {
      connectionStatus = "token_missing";
      message = "Threads 액세스 토큰이 없어 재연결이 필요합니다.";
    } else {
      try {
        profile = await getCurrentThreadsUser(env.THREADS_ACCESS_TOKEN!);
        connectionStatus = "connected";
      } catch (error) {
        connectionStatus = "error";
        message =
          error instanceof Error
            ? error.message
            : "Threads 연결 상태를 확인하지 못했습니다.";
      }
    }

    response.json({
      connectionStatus,
      message,
      oauthConfigured: hasOauthConfig,
      accessTokenConfigured: hasToken,
      userIdConfigured: hasUserId,
      appId: env.THREADS_APP_ID ?? null,
      redirectUri: env.THREADS_REDIRECT_URI ?? null,
      configuredUserId: env.THREADS_USER_ID ?? null,
      authorizeUrl,
      profile,
      profileUrl: profile?.username
        ? `https://www.threads.com/@${profile.username}`
        : null
    });
  })
);

threadsRouter.get(
  "/insights/summary",
  requireAdminAuth,
  asyncHandler(async (_request, response) => {
    const summary = await getThreadsInsightsSummary();

    response.json(summary);
  })
);

threadsRouter.post(
  "/insights/sync",
  requireAdminAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const result = await syncThreadsInsights();

    await recordAuditEvent({
      action: "threads.insights_synced",
      entityType: "threads_insights",
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId,
      metadata: result
    });

    response.status(201).json(result);
  })
);

threadsRouter.get(
  "/oauth/callback",
  asyncHandler(async (request, response) => {
    const code = request.query.code;

    if (typeof code !== "string" || !code) {
      response.status(400).json({
        error: "Missing OAuth code."
      });
      return;
    }

    const shortLivedToken = await exchangeCodeForShortLivedToken(code);
    const longLivedToken = await exchangeLongLivedToken(
      shortLivedToken.access_token
    );

    response.json({
      shortLivedToken,
      longLivedToken
    });
  })
);

threadsRouter.all(
  "/oauth/deauthorize",
  asyncHandler(async (request: RequestWithContext, response) => {
    const signedRequest = readSignedRequest(request);
    const payload = parseSignedRequest(signedRequest);

    await recordAuditEvent({
      action: "threads.oauth.deauthorized",
      entityType: "threads_integration",
      actorType: "system",
      actorIdentifier: "meta-threads",
      requestId: request.requestId,
      metadata: {
        userId: payload?.user_id ?? null,
        profileId: payload?.profile_id ?? null,
        hasSignedRequest: Boolean(signedRequest),
        verified: Boolean(payload)
      }
    });

    response.status(200).json({
      success: true
    });
  })
);

threadsRouter.all(
  "/oauth/delete",
  asyncHandler(async (request: RequestWithContext, response) => {
    const signedRequest = readSignedRequest(request);
    const payload = parseSignedRequest(signedRequest);
    const confirmationCode = crypto.randomUUID();
    const statusUrl = new URL(
      `/integrations/threads/oauth/delete/status?code=${confirmationCode}`,
      getPublicBaseUrl(request)
    ).toString();

    await recordAuditEvent({
      action: "threads.oauth.deletion_requested",
      entityType: "threads_integration",
      actorType: "system",
      actorIdentifier: "meta-threads",
      requestId: request.requestId,
      metadata: {
        confirmationCode,
        userId: payload?.user_id ?? null,
        profileId: payload?.profile_id ?? null,
        hasSignedRequest: Boolean(signedRequest),
        verified: Boolean(payload)
      }
    });

    response.status(200).json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });
  })
);

threadsRouter.get(
  "/oauth/delete/status",
  (request: RequestWithContext, response) => {
    const code = request.query.code;

    response.status(200).json({
      status: "completed",
      confirmation_code: typeof code === "string" ? code : null
    });
  }
);

threadsRouter.post(
  "/publish-test",
  requireAdminAuth,
  async (request, response) => {
    const accessToken = request.body?.accessToken ?? env.THREADS_ACCESS_TOKEN;
    const text =
      request.body?.text ??
      "Philip Threadbot test publish from admin endpoint.";

    if (!accessToken) {
      response.status(400).json({
        error: "Threads publish requires an access token."
      });
      return;
    }

    const container = await createTextThread({
      accessToken,
      text
    });

    const publishResult = await publishThread({
      accessToken,
      creationId: container.id
    });

    response.json({
      container,
      publishResult
    });
  }
);

export { threadsRouter };
