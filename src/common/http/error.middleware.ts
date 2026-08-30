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

  // Handle Express payload too large errors (body size limit exceeded)
  if ("status" in error && error.status === 413) {
    logger.error(
      {
        err: error,
        method: request.method,
        path: request.originalUrl,
        statusCode: 413,
      },
      "Request failed",
    );
    response.status(413).json({
      success: false,
      message: "Payload too large",
    });
    return;
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
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
