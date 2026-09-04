import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("apiKeyAuth middleware", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns 401 when the configured API key header is missing", async () => {
    vi.stubEnv("AUTH_API_KEY", "super-secret-key");
    vi.resetModules();
    const { createApp } = await import("../src/app");

    const response = await request(createApp()).get("/api/v1/agents");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("API key is required");
  });

  it("returns 403 when the provided key has the wrong length", async () => {
    vi.stubEnv("AUTH_API_KEY", "super-secret-key");
    vi.resetModules();
    const { createApp } = await import("../src/app");

    const response = await request(createApp())
      .get("/api/v1/agents")
      .set("x-api-key", "wrong-length");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid API key");
  });

  it("returns 403 for a near-miss key of the same length", async () => {
    vi.stubEnv("AUTH_API_KEY", "super-secret-key");
    vi.resetModules();
    const { createApp } = await import("../src/app");

    const response = await request(createApp())
      .get("/api/v1/agents")
      .set("x-api-key", "super-secret-kej");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid API key");
  });

  it("allows the request when the API key matches", async () => {
    vi.stubEnv("AUTH_API_KEY", "super-secret-key");
    vi.resetModules();
    const { createApp } = await import("../src/app");

    const response = await request(createApp())
      .get("/api/v1/agents")
      .set("x-api-key", "super-secret-key");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("skips authentication when no API key is configured", async () => {
    vi.stubEnv("AUTH_API_KEY", "");
    vi.resetModules();
    const { createApp } = await import("../src/app");

    const response = await request(createApp()).get("/api/v1/agents");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
