import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";
import { RequestWithContext } from "./request-context";

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction
) {
  void next;

  const message =
    error instanceof Error ? error.message : "Unexpected server error.";

  const contextualRequest = request as RequestWithContext;

  logger.error("request.failed", {
    requestId: contextualRequest.requestId,
    method: request.method,
    path: request.originalUrl,
    error
  });

  response.status(500).json({
    error: message,
    requestId: contextualRequest.requestId ?? null
  });
}
