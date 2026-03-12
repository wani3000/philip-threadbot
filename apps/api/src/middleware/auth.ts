import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import {
  createSupabaseAuthClient,
  hasSupabaseAuthConfig
} from "../lib/supabase";
import { isDemoModeEnabled } from "../lib/runtime";
import { logger } from "../lib/logger";
import { RequestWithContext } from "./request-context";

export type AuthenticatedRequest = RequestWithContext & {
  adminUser?: {
    id: string;
    email: string;
  };
};

function getBearerToken(request: Request) {
  const authorizationHeader = request.header("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

export async function requireAdminAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    response.status(401).json({
      error: "Missing bearer token."
    });
    return;
  }

  if (isDemoModeEnabled()) {
    if (accessToken !== env.ADMIN_BEARER_TOKEN) {
      logger.warn("auth.demo_token_rejected", {
        requestId: request.requestId,
        path: request.originalUrl
      });
      response.status(401).json({
        error: "Invalid local admin token."
      });
      return;
    }

    request.adminUser = {
      id: "demo-admin",
      email: env.ADMIN_EMAILS[0] ?? "demo-admin@local"
    };

    next();
    return;
  }

  if (!hasSupabaseAuthConfig) {
    response.status(500).json({
      error:
        "Admin auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY."
    });
    return;
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.email) {
    response.status(401).json({
      error: "Invalid or expired auth token."
    });
    return;
  }

  const normalizedEmail = data.user.email.toLowerCase();

  if (env.ADMIN_EMAILS.length === 0) {
    response.status(500).json({
      error: "ADMIN_EMAILS is not configured."
    });
    return;
  }

  if (!env.ADMIN_EMAILS.includes(normalizedEmail)) {
    response.status(403).json({
      error: "Authenticated user is not an allowed admin."
    });
    return;
  }

  request.adminUser = {
    id: data.user.id,
    email: normalizedEmail
  };

  logger.debug("auth.admin_authenticated", {
    requestId: request.requestId,
    email: normalizedEmail
  });

  next();
}
