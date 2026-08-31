import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { env } from "../src/config/env";

describe("health endpoints", () => {
  const app = createApp();

  it("returns the service health payload", async () => {
    const beforeRequest = Date.now();
    const response = await request(app).get("/api/v1/health");
    const afterRequest = Date.now();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const { status, service, environment, timestamp } = response.body.data;
    const timestampMs = Date.parse(timestamp);

    expect(status).toEqual(expect.any(String));
    expect(status.length).toBeGreaterThan(0);
    expect(service).toBe(env.APP_NAME);
    expect(environment).toBe(env.NODE_ENV);
    expect(timestamp).toBe(new Date(timestampMs).toISOString());
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
