import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "./app-error";

export const errorHandler = (
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  void _next;

  const statusCode =
    error instanceof AppError
      ? error.statusCode
      : "status" in error && typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
  const details = error instanceof AppError ? error.details : undefined;
  const isAppError = error instanceof AppError;

  logger.error(
    {
      err: error,
      method: request.method,
      path: request.originalUrl,
      statusCode,
    },
    "Request failed",
  );

  response.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && !isAppError && env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
    ...(details ? { details } : {}),
  });
};
