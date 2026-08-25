import rateLimit from "express-rate-limit";

import { securityConfig } from "./env";

export const apiRateLimiter = rateLimit({
  windowMs: securityConfig.rateLimitWindowMs,
  limit: securityConfig.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

export const writeRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    success: false,
    message: "Too many write requests, please try again later.",
  },
});
