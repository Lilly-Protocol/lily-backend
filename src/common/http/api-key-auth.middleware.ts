import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { securityConfig } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "./app-error";

let warnedAboutMissingKey = false;

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function apiKeyAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  if (!securityConfig.authApiKey) {
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      logger.warn(
        "AUTH_API_KEY is not set — API key authentication is disabled",
      );
    }
    return next();
  }

  const headerName = securityConfig.authApiKeyHeader;
  const providedKey = request.get(headerName);

  if (!providedKey) {
    return next(new AppError(401, "API key is required"));
  }

  if (!constantTimeCompare(providedKey, securityConfig.authApiKey)) {
    return next(new AppError(403, "Invalid API key"));
  }

  return next();
}
