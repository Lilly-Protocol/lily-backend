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
    code: "RATE_LIMITED",
    message: "Too many requests, please try again later.",
  },
});
