import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export function requireCronSecret(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const headerSecret = request.header("x-cron-secret");
  const authorizationHeader = request.header("authorization");
  const bearerSecret = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : null;
  const providedSecret = headerSecret ?? bearerSecret;

  if (!providedSecret) {
    response.status(401).json({
      error: "Missing cron secret header."
    });
    return;
  }

  if (providedSecret !== env.CRON_SECRET) {
    response.status(403).json({
      error: "Invalid cron secret."
    });
    return;
  }

  next();
}
