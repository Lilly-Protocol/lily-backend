import request from "supertest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("TRUST_PROXY application and rate limiting integration (issue #280)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it(
    "applies the configured trust proxy value to express (default false)",
    async () => {
      process.env.NODE_ENV = "test";
      delete process.env.TRUST_PROXY;

      const { securityConfig } = await import("../src/config/env");
      const { createApp } = await import("../src/app");
      const app = createApp();

      expect(app.get("trust proxy")).toBe(securityConfig.trustProxy);
      expect(app.get("trust proxy")).toBe(false);
    },
    15000,
  );

  it("applies the configured trust proxy value when TRUST_PROXY is set to a hop count", async () => {
    process.env.NODE_ENV = "test";
    process.env.TRUST_PROXY = "1";

    const { securityConfig } = await import("../src/config/env");
    const { createApp } = await import("../src/app");
    const app = createApp();

    expect(app.get("trust proxy")).toBe(securityConfig.trustProxy);
    expect(app.get("trust proxy")).toBe(1);
  });

  it("applies the configured trust proxy value when TRUST_PROXY is 'loopback'", async () => {
    process.env.NODE_ENV = "test";
    process.env.TRUST_PROXY = "loopback";

    const { securityConfig } = await import("../src/config/env");
    const { createApp } = await import("../src/app");
    const app = createApp();

    expect(app.get("trust proxy")).toBe(securityConfig.trustProxy);
    expect(app.get("trust proxy")).toBe("loopback");
  });

  it("rate limits distinct X-Forwarded-For IPs independently when TRUST_PROXY=1", async () => {
    process.env.NODE_ENV = "production";
    process.env.TRUST_PROXY = "1";
    process.env.RATE_LIMIT_MAX_REQUESTS = "2";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";

    const { createApp } = await import("../src/app");
    const app = createApp();

    const clientA = "203.0.113.195";
    const clientB = "198.51.100.17";

    // Client A makes 2 requests to reach the limit
    const resA1 = await request(app)
      .get("/api/v1/health")
      .set("X-Forwarded-For", clientA);
    expect(resA1.status).toBe(200);

    const resA2 = await request(app)
      .get("/api/v1/health")
      .set("X-Forwarded-For", clientA);
    expect(resA2.status).toBe(200);

    // Client A's 3rd request should be blocked with 429
    const resA3 = await request(app)
      .get("/api/v1/health")
      .set("X-Forwarded-For", clientA);
    expect(resA3.status).toBe(429);
    expect(resA3.body.success).toBe(false);

    // Client B with distinct X-Forwarded-For header should NOT be blocked
    const resB1 = await request(app)
      .get("/api/v1/health")
      .set("X-Forwarded-For", clientB);
    expect(resB1.status).toBe(200);
    expect(resB1.body.success).toBe(true);
  });

  it("collapses distinct X-Forwarded-For IPs into a single bucket when TRUST_PROXY is false", async () => {
    process.env.NODE_ENV = "production";
    process.env.TRUST_PROXY = "false";
    process.env.RATE_LIMIT_MAX_REQUESTS = "2";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";

    const { createApp } = await import("../src/app");
    const app = createApp();

    const clientA = "203.0.113.195";
    const clientB = "198.51.100.17";

    // Two requests from Client A exhaust the shared socket IP limit
    await request(app)
      .get("/api/v1/health")
      .set("X-Forwarded-For", clientA);
    await request(app)
      .get("/api/v1/health")
      .set("X-Forwarded-For", clientA);

    // Client B with distinct X-Forwarded-For is also blocked because trust proxy is disabled
    const resB = await request(app)
      .get("/api/v1/health")
      .set("X-Forwarded-For", clientB);
    expect(resB.status).toBe(429);
  });
});
