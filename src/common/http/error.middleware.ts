import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "./app-error";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
};

const getStatusCode = (error: Error): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  const httpError = error as HttpError;
  const statusCode = httpError.statusCode ?? httpError.status;

  return typeof statusCode === "number" && statusCode >= 400 && statusCode < 600
    ? statusCode
    : 500;
};

export const errorHandler = (
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  void _next;

  const statusCode = getStatusCode(error);
  const details = error instanceof AppError ? error.details : undefined;

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
        : error.message,
    ...(details ? { details } : {}),
  });
};
