import type { NextFunction, Request, Response } from "express";

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "./app-error";

interface BodyParserError extends SyntaxError {
  status: number;
  type: string;
}

const isMalformedJsonError = (error: Error): error is BodyParserError =>
  error instanceof SyntaxError &&
  "status" in error &&
  error.status === 400 &&
  "type" in error &&
  error.type === "entity.parse.failed";

export const errorHandler = (
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  void _next;

  const malformedJson = isMalformedJsonError(error);
  const statusCode = error instanceof AppError ? error.statusCode : malformedJson ? 400 : 500;
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
        : malformedJson
          ? "Malformed JSON body"
          : error.message,
    ...(details ? { details } : {}),
  });
};
