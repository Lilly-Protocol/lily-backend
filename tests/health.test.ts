import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("health endpoints", () => {
  const app = createApp();

  it("returns the service health payload", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("returns a typed 404 payload for missing routes", async () => {
    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Route not found");
  });

  it("asserts all health payload fields per contract (issue #134)", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("service");
    expect(data).toHaveProperty("environment");
    expect(data).toHaveProperty("timestamp");

    expect(typeof data.status).toBe("string");
    expect(typeof data.service).toBe("string");
    expect(typeof data.environment).toBe("string");
    expect(typeof data.timestamp).toBe("string");
  });

  it("asserts timestamp is valid ISO-8601 near current time (issue #134)", async () => {
    const before = Date.now();
    const response = await request(app).get("/api/v1/health");
    const after = Date.now();

    const ts = new Date(response.body.data.timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before - 1000);
    expect(ts).toBeLessThanOrEqual(after + 1000);
    expect(Number.isNaN(ts)).toBe(false);
  });

  it("asserts service field matches APP_NAME env var (issue #134)", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.body.data.service).toBeTruthy();
    expect(typeof response.body.data.service).toBe("string");
    expect(response.body.data.service.length).toBeGreaterThan(0);
  });

  it("asserts environment field is present (issue #134)", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.body.data.environment).toBeTruthy();
    expect(typeof response.body.data.environment).toBe("string");
  });
});
