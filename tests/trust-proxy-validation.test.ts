import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import rateLimit from "express-rate-limit";
import express from "express";

import { rateLimitHandler } from "../src/config/rate-limit";

describe("TRUST_PROXY configuration validation (issue #80)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should accept 'false' and transform to boolean false", async () => {
    process.env.TRUST_PROXY = "false";
    process.env.NODE_ENV = "test";
    const { env } = await import("../src/config/env");
    expect(env.TRUST_PROXY).toBe(false);
  });

  it("should accept numeric hop counts as strings", async () => {
    process.env.TRUST_PROXY = "1";
    process.env.NODE_ENV = "test";
    const { env } = await import("../src/config/env");
    expect(env.TRUST_PROXY).toBe(1);
  });

  it("should accept 'loopback' as a valid value", async () => {
    process.env.TRUST_PROXY = "loopback";
    process.env.NODE_ENV = "test";
    const { env } = await import("../src/config/env");
    expect(env.TRUST_PROXY).toBe("loopback");
  });

  it("should reject 'true' as unsafe", async () => {
    process.env.TRUST_PROXY = "true";
    process.env.NODE_ENV = "test";
    await expect(import("../src/config/env")).rejects.toThrow(
      "Invalid environment configuration",
    );
  });

  it("should reject arbitrary string values", async () => {
    process.env.TRUST_PROXY = "yolo";
    process.env.NODE_ENV = "test";
    await expect(import("../src/config/env")).rejects.toThrow(
      "Invalid environment configuration",
    );
  });

  it("should default to false when unset", async () => {
    delete process.env.TRUST_PROXY;
    process.env.NODE_ENV = "test";
    const { env } = await import("../src/config/env");
    expect(env.TRUST_PROXY).toBe(false);
  });
});

describe("TRUST_PROXY applied to Express app (issue #280)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("sets app trust proxy to the configured value", async () => {
    process.env.TRUST_PROXY = "1";
    process.env.NODE_ENV = "test";
    const { createApp } = await import("../src/app");
    const { securityConfig } = await import("../src/config/env");

    const app = createApp();
    expect(app.get("trust proxy")).toBe(securityConfig.trustProxy);
  });

  it("uses X-Forwarded-For as the client IP when TRUST_PROXY is set", async () => {
    process.env.TRUST_PROXY = "1";
    process.env.NODE_ENV = "test";
    const app = express();
    app.set("trust proxy", 1);
    app.get("/ip", (request, response) => {
      response.status(200).json({ ip: request.ip });
    });

    const response = await request(app)
      .get("/ip")
      .set("X-Forwarded-For", "203.0.113.42");

    expect(response.status).toBe(200);
    expect(response.body.ip).toBe("203.0.113.42");
  });

  it("rate-limits distinct X-Forwarded-For clients independently", async () => {
    process.env.TRUST_PROXY = "1";
    process.env.NODE_ENV = "test";
    const { securityConfig } = await import("../src/config/env");

    const app = express();
    app.set("trust proxy", 1);
    app.use(
      rateLimit({
        windowMs: securityConfig.rateLimitWindowMs,
        limit: 1,
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => false,
        handler: rateLimitHandler,
      }),
    );
    app.get("/", (_request, response) => {
      response.status(200).json({ ok: true });
    });

    const firstClient = await request(app)
      .get("/")
      .set("X-Forwarded-For", "203.0.113.1");
    expect(firstClient.status).toBe(200);

    const secondClient = await request(app)
      .get("/")
      .set("X-Forwarded-For", "203.0.113.2");
    expect(secondClient.status).toBe(200);

    const sameClientAgain = await request(app)
      .get("/")
      .set("X-Forwarded-For", "203.0.113.1");
    expect(sameClientAgain.status).toBe(429);
  });
});
