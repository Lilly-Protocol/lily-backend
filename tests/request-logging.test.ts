import type { IncomingMessage } from "node:http";

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const requestWithUrl = (url: string): IncomingMessage =>
  ({ url }) as IncomingMessage;

const importShouldIgnoreRequestLog = async () => {
  const { shouldIgnoreRequestLog } =
    await import("../src/config/request-logging");
  return shouldIgnoreRequestLog;
};

describe("request logging ignore rules", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([
    "/",
    "/?probe=1",
    "/api/v1/health",
    "/api/v1/health/",
    "/api/v1/health?probe=1",
    "/api/v1/metrics",
    "/api/v1/metrics?probe=1",
  ])("ignores %s", async (url) => {
    process.env.API_PREFIX = "/api/v1";
    const shouldIgnoreRequestLog = await importShouldIgnoreRequestLog();
    expect(shouldIgnoreRequestLog(requestWithUrl(url))).toBe(true);
  });

  it.each(["/api/v1/agents", "/api/v1/healthy", "/health", "/api/v1/metricss"])(
    "keeps %s in request logs",
    async (url) => {
      process.env.API_PREFIX = "/api/v1";
      const shouldIgnoreRequestLog = await importShouldIgnoreRequestLog();
      expect(shouldIgnoreRequestLog(requestWithUrl(url))).toBe(false);
    },
  );

  it("ignores health and metrics under a custom API_PREFIX", async () => {
    process.env.API_PREFIX = "/api/v2";
    const shouldIgnoreRequestLog = await importShouldIgnoreRequestLog();

    expect(shouldIgnoreRequestLog(requestWithUrl("/api/v2/health"))).toBe(true);
    expect(shouldIgnoreRequestLog(requestWithUrl("/api/v2/health/ready"))).toBe(
      true,
    );
    expect(shouldIgnoreRequestLog(requestWithUrl("/api/v2/metrics"))).toBe(
      true,
    );
    expect(shouldIgnoreRequestLog(requestWithUrl("/api/v1/health"))).toBe(
      false,
    );
    expect(shouldIgnoreRequestLog(requestWithUrl("/api/v1/metrics"))).toBe(
      false,
    );
  });
});
