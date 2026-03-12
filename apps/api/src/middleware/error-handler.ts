import { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction
) {
  void next;

  const message =
    error instanceof Error ? error.message : "Unexpected server error.";

  response.status(500).json({
    error: message
  });
}
