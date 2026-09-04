import type { IncomingMessage } from "node:http";

import { describe, expect, it } from "vitest";

import { shouldIgnoreRequestLog } from "../src/config/request-logging";

const requestWithUrl = (url: string): IncomingMessage =>
  ({ url }) as IncomingMessage;

describe("request logging ignore rules", () => {
  it.each([
    "/",
    "/?probe=1",
    "/api/v1/health",
    "/api/v1/health/",
    "/api/v1/health?probe=1",
    "/api/v1/health/live",
    "/api/v1/health/ready",
    "/api/v1/metrics",
    "/api/v1/metrics/",
    "/api/v1/metrics?format=prometheus",
  ])("ignores default prefix operational path %s", (url) => {
    expect(shouldIgnoreRequestLog(requestWithUrl(url))).toBe(true);
  });

  it.each(["/api/v1/agents", "/api/v1/healthy", "/health", "/metrics", "/api/v1/payments"])(
    "keeps %s in request logs with default prefix",
    (url) => {
      expect(shouldIgnoreRequestLog(requestWithUrl(url))).toBe(false);
    },
  );

  describe("with custom API_PREFIX (/api/v2)", () => {
    const customPrefix = "/api/v2";

    it.each([
      "/",
      "/api/v2/health",
      "/api/v2/health/live",
      "/api/v2/health/ready",
      "/api/v2/metrics",
    ])("ignores %s under custom prefix", (url) => {
      expect(shouldIgnoreRequestLog(requestWithUrl(url), customPrefix)).toBe(true);
    });

    it.each([
      "/api/v1/health",
      "/api/v1/metrics",
      "/api/v2/agents",
      "/api/v2/healthy",
    ])("keeps %s in request logs under custom prefix", (url) => {
      expect(shouldIgnoreRequestLog(requestWithUrl(url), customPrefix)).toBe(false);
    });
  });
});
