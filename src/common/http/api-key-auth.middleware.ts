import type { NextFunction, Request, Response } from "express";
import { timingSafeEqual } from "crypto";

import { securityConfig } from "../../config/env";
import { logger } from "../../config/logger";
import { AppError } from "./app-error";

let warnedAboutMissingKey = false;

export function apiKeyAuth(request: Request, _response: Response, next: NextFunction): void {
  if (!securityConfig.authApiKey) {
    if (!warnedAboutMissingKey) {
      warnedAboutMissingKey = true;
      logger.warn("AUTH_API_KEY is not set — API key authentication is disabled");
    }
    return next();
  }

  const headerName = securityConfig.authApiKeyHeader;
  const providedKey = request.get(headerName);

  if (!providedKey) {
    return next(new AppError(401, "API key is required"));
  }

  const expected = securityConfig.authApiKey;
  const providedBuf = Buffer.from(providedKey, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    return next(new AppError(403, "Invalid API key"));
  }

  return next();
}
