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

  let statusCode: number;
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    details = error.details;
  } else if (
    error instanceof SyntaxError &&
    "body" in error &&
    typeof (error as SyntaxError & { body?: unknown }).body === "string"
  ) {
    statusCode = 400;
  } else if (
    "status" in error &&
    typeof (error as Error & { status?: number }).status === "number"
  ) {
    statusCode = (error as Error & { status: number }).status;
  } else {
    statusCode = 500;
  }

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
