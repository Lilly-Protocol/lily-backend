import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

describe("API rate limiter", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalWindowMs = process.env.RATE_LIMIT_WINDOW_MS;
  const originalMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS;

  beforeAll(() => {
    process.env.NODE_ENV = "development";
    process.env.RATE_LIMIT_WINDOW_MS = "1000";
    process.env.RATE_LIMIT_MAX_REQUESTS = "1";
    vi.resetModules();
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalWindowMs === undefined) delete process.env.RATE_LIMIT_WINDOW_MS;
    else process.env.RATE_LIMIT_WINDOW_MS = originalWindowMs;

    if (originalMaxRequests === undefined)
      delete process.env.RATE_LIMIT_MAX_REQUESTS;
    else process.env.RATE_LIMIT_MAX_REQUESTS = originalMaxRequests;
  });

  it("returns a typed 429 response with standard rate-limit headers", async () => {
    const { apiRateLimiter } = await import("../src/config/rate-limit");
    const app = express();

    app.use(apiRateLimiter);
    app.get("/limited", (_request, response) => {
      response.status(200).json({ success: true });
    });

    await request(app).get("/limited").expect(200);
    const response = await request(app).get("/limited");

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      message: "Too many requests, please try again later.",
    });
    expect(response.headers).toHaveProperty("ratelimit-limit");
    expect(response.headers).toHaveProperty("ratelimit-remaining");
    expect(response.headers).toHaveProperty("ratelimit-reset");
  });
});
