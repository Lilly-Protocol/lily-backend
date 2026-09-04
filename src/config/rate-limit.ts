import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

import { env, securityConfig } from "./env";

interface RateLimitLocals {
  resetTime?: Date | null;
}

/**
 * Checks if a request path is an operational endpoint (health, metrics, root)
 * that should be exempted from rate limiting to prevent orchestrator probes
 * and metrics scrapers from consuming client rate-limit budget or causing 429s.
 */
export const isOperationalPath = (
  req: Request,
  prefix: string = env.API_PREFIX,
): boolean => {
  const urlString = req.originalUrl || req.url || "/";
  const pathname = new URL(urlString, "http://localhost").pathname;
  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const healthPath = `${normalizedPrefix}/health`;
  const metricsPath = `${normalizedPrefix}/metrics`;

  return (
    pathname === "/" ||
    pathname === healthPath ||
    pathname.startsWith(`${healthPath}/`) ||
    pathname === metricsPath ||
    pathname.startsWith(`${metricsPath}/`) ||
    req.path === "/health" ||
    req.path?.startsWith("/health/") ||
    req.path === "/metrics" ||
    req.path?.startsWith("/metrics/")
  );
};

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
  skip: (req) => process.env.NODE_ENV === "test" || isOperationalPath(req),
  handler: rateLimitHandler,
});

export const writeRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test" || isOperationalPath(req),
  handler: rateLimitHandler,
});
