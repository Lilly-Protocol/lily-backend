import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

import { securityConfig } from "./env";

interface RateLimitLocals {
  resetTime?: Date | null;
}

/**
 * Custom 429 handler used when an express-rate-limit limiter is exceeded.
 * Reads the limiter-provided reset time from `res.locals.rateLimit` so the
 * Retry-After header and the response envelope reflect when the window resets.
 */
export const rateLimitHandler = (
  _request: Request,
  response: Response,
): void => {
  const resetTime =
    (response.locals as { rateLimit?: RateLimitLocals }).rateLimit?.resetTime ??
    null;

  if (resetTime && resetTime.getTime() > Date.now()) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((resetTime.getTime() - Date.now()) / 1000),
    );
    response.setHeader("Retry-After", String(retryAfterSeconds));
  }

  response.status(429).json({
    success: false,
    message: "Too many requests, please try again later.",
    details: { resetTime: resetTime ? resetTime.toISOString() : null },
  });
};

export const apiRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimitWindowMs,
  limit: securityConfig.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: rateLimitHandler,
});

export const writeRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: rateLimitHandler,
});
