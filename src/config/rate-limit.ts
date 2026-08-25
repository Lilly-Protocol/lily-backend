import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

import { securityConfig } from "./env";

export function rateLimitHandler(
  _req: Request,
  res: Response,
): void {
  const resetTime = res.locals.rateLimit?.resetTime as Date | undefined;
  const retryAfterSeconds = resetTime
    ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
    : 0;

  if (retryAfterSeconds > 0) {
    res.setHeader("Retry-After", String(retryAfterSeconds));
  }

  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later.",
    details: {
      resetTime: resetTime?.toISOString() ?? null,
    },
  });
}

export const apiRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimitWindowMs,
  limit: securityConfig.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: rateLimitHandler,
});
