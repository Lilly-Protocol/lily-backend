import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import rateLimit from "express-rate-limit";
import express from "express";

describe("TRUST_PROXY + Rate Limiting (issue #280)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should apply trust proxy setting from securityConfig", async () => {
    process.env.TRUST_PROXY = "1";
    process.env.NODE_ENV = "test";
    const { createApp } = await import("../src/app");
    const app = createApp();

    const trustProxyValue = app.get("trust proxy");
    expect(trustProxyValue).toBe(1);
  });

  it("should accept loopback as trust proxy value", async () => {
    process.env.TRUST_PROXY = "loopback";
    process.env.NODE_ENV = "test";
    const { createApp } = await import("../src/app");
    const app = createApp();

    expect(app.get("trust proxy")).toBe("loopback");
  });

  it("should default trust proxy to false when unset", async () => {
    delete process.env.TRUST_PROXY;
    process.env.NODE_ENV = "test";
    const { createApp } = await import("../src/app");
    const app = createApp();

    expect(app.get("trust proxy")).toBe(false);
  });

  /**
   * Verifies that when TRUST_PROXY is enabled, Express respects X-Forwarded-For
   * for IP-based middleware (like rate limiting). We use a minimal express app
   * mirroring the real app's trust proxy + rate limit setup, but without
   * the test-environment skip, so we can observe real rate-limit behavior.
   */
  it("should rate limit requests with different X-Forwarded-For independently when TRUST_PROXY=1", async () => {
    const app = express();
    app.set("trust proxy", 1);

    // Minimal rate limiter without test skip — mirrors production behavior
    const testLimiter = rateLimit({
      windowMs: 5000,
      limit: 2,
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use(testLimiter);
    app.get("/api/v1/test", (_req, res) => {
      res.json({ ok: true });
    });

    // Client A: exhaust their allowance
    const resA1 = await request(app)
      .get("/api/v1/test")
      .set("X-Forwarded-For", "10.0.0.1");
    expect(resA1.status).toBe(200);

    const resA2 = await request(app)
      .get("/api/v1/test")
      .set("X-Forwarded-For", "10.0.0.1");
    expect(resA2.status).toBe(200);

    // Client A's 3rd request should be rate limited
    const resA3 = await request(app)
      .get("/api/v1/test")
      .set("X-Forwarded-For", "10.0.0.1");
    expect(resA3.status).toBe(429);

    // Client B with different IP gets their own bucket (independent of A)
    const resB1 = await request(app)
      .get("/api/v1/test")
      .set("X-Forwarded-For", "10.0.0.2");
    expect(resB1.status).toBe(200);
  });

  /**
   * Contrast: without trust proxy, all requests share one bucket
   * (because they all appear to come from localhost/127.0.0.1).
   */
  it("should share one rate-limit bucket when TRUST_PROXY=false (default)", async () => {
    const app = express();
    app.set("trust proxy", false);

    const testLimiter = rateLimit({
      windowMs: 5000,
      limit: 2,
      standardHeaders: true,
      legacyHeaders: false,
    });

    app.use(testLimiter);
    app.get("/api/v1/test", (_req, res) => {
      res.json({ ok: true });
    });

    // Two different X-Forwarded-For values
    const res1 = await request(app)
      .get("/api/v1/test")
      .set("X-Forwarded-For", "10.0.0.1");
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .get("/api/v1/test")
      .set("X-Forwarded-For", "10.0.0.2");
    expect(res2.status).toBe(200);

    // Third request from ANY client should be limited (shared bucket)
    const res3 = await request(app)
      .get("/api/v1/test")
      .set("X-Forwarded-For", "10.0.0.3");
    expect(res3.status).toBe(429);
  });
});
