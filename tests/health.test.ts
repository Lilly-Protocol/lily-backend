import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { env } from "../src/config/env";

describe("health endpoints", () => {
  const app = createApp();

  it("returns the full service health payload contract", async () => {
    const beforeRequest = Date.now();
    const response = await request(app).get("/api/v1/health");
    const afterRequest = Date.now();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      status: expect.any(String),
      service: env.APP_NAME,
      environment: env.NODE_ENV,
      timestamp: expect.any(String),
    });

    const timestamp = response.body.data.timestamp as string;
    const timestampMs = Date.parse(timestamp);

    expect(Number.isNaN(timestampMs)).toBe(false);
    expect(new Date(timestampMs).toISOString()).toBe(timestamp);
    expect(timestampMs).toBeGreaterThanOrEqual(beforeRequest);
    expect(timestampMs).toBeLessThanOrEqual(afterRequest);
  });

  it("returns a typed 404 payload for missing routes", async () => {
    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Route not found");
  });
});
