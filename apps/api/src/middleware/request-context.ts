import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

export type RequestWithContext = Request & {
  requestId?: string;
  startedAt?: number;
};

export function attachRequestContext(
  request: RequestWithContext,
  response: Response,
  next: NextFunction
) {
  request.requestId = randomUUID();
  request.startedAt = Date.now();
  response.setHeader("x-request-id", request.requestId);

  response.on("finish", () => {
    const durationMs = request.startedAt
      ? Date.now() - request.startedAt
      : undefined;

    logger.info("request.completed", {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs
    });
  });

  next();
}
