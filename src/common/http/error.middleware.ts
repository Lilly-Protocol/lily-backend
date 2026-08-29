import type { NextFunction, Request, Response } from "express";

import { AppError } from "@/common/http/app-error";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

export const errorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  void _next;

  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const details = isAppError ? error.details : undefined;
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred";

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
      statusCode === 500 && env.NODE_ENV === "production"
        ? "Internal server error"
        : rawMessage,
    ...(details !== undefined ? { details } : {}),
  });
};
