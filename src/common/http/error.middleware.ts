import type { NextFunction, Request, Response } from "express";

import { AppError } from "@/common/http/app-error";
import { env } from "@/config/env";
import { logger } from "@/config/logger";

type HttpLikeError = Error & {
  status?: unknown;
  statusCode?: unknown;
  type?: string;
};

const isHttpStatusCode = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 400 &&
  value <= 599;

const getStatusCode = (error: unknown): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  const httpError = error as HttpLikeError;

  if (isHttpStatusCode(httpError.statusCode)) {
    return httpError.statusCode;
  }

  if (isHttpStatusCode(httpError.status)) {
    return httpError.status;
  }

  return 500;
};

const getMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (!(error instanceof Error)) {
    return "An unexpected error occurred";
  }

  const httpError = error as HttpLikeError;

  if (httpError.type === "entity.parse.failed") {
    return "Malformed JSON request body";
  }

  if (httpError.type === "entity.too.large") {
    return "Request body too large";
  }

  return error.message;
};

export const errorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  void _next;

  if (response.locals) {
    response.locals.errorHandled = true;
  }
  (request as unknown as { _errorHandled?: boolean })._errorHandled = true;

  const statusCode = getStatusCode(error);
  const isAppError = error instanceof AppError;
  const details = isAppError ? error.details : undefined;

  const logLevel = statusCode >= 400 && statusCode < 500 ? "warn" : "error";

  logger[logLevel](
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
    ...(isAppError && error.code ? { code: error.code } : {}),
    message:
      statusCode === 500 && !isAppError && env.NODE_ENV === "production"
        ? "Internal server error"
        : getMessage(error),
    ...(details !== undefined ? { details } : {}),
  });
};
