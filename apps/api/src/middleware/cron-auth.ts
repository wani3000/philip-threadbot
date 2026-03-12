import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export function requireCronSecret(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const providedSecret = request.header("x-cron-secret");

  if (!providedSecret) {
    response.status(401).json({
      error: "Missing x-cron-secret header."
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

