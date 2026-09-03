import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";

const TEST_KEY = "test-secret-key-12345";

describe("API key authentication middleware (issue #81)", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.AUTH_API_KEY;
    process.env.AUTH_API_KEY = TEST_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.AUTH_API_KEY = originalKey;
    } else {
      delete process.env.AUTH_API_KEY;
    }
  });

  it("returns 401 when no API key is provided", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).get("/api/v1/agents");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("API key");
  });

  it("returns 403 when an invalid API key is provided", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app)
      .get("/api/v1/agents")
      .set("x-api-key", "wrong-key");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid");
  });

  it("rejects near-miss keys differing only in the last or first character", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    // Near-miss differing in last character
    const nearMissEnd = TEST_KEY.slice(0, -1) + "X";
    const resEnd = await request(app)
      .get("/api/v1/agents")
      .set("x-api-key", nearMissEnd);

    expect(resEnd.status).toBe(403);
    expect(resEnd.body.success).toBe(false);

    // Near-miss differing in first character
    const nearMissStart = "X" + TEST_KEY.slice(1);
    const resStart = await request(app)
      .get("/api/v1/agents")
      .set("x-api-key", nearMissStart);

    expect(resStart.status).toBe(403);
    expect(resStart.body.success).toBe(false);
  });

  it("rejects keys of unequal length (both shorter and longer)", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    // Shorter key
    const resShorter = await request(app)
      .get("/api/v1/agents")
      .set("x-api-key", TEST_KEY.slice(0, 5));

    expect(resShorter.status).toBe(403);

    // Longer key
    const resLonger = await request(app)
      .get("/api/v1/agents")
      .set("x-api-key", TEST_KEY + "-extra-bytes");

    expect(resLonger.status).toBe(403);
  });

  it("returns 200 when the correct API key is provided", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app)
      .get("/api/v1/agents")
      .set("x-api-key", TEST_KEY);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("keeps /health public without requiring an API key", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("disables auth with a warning when AUTH_API_KEY is not set", async () => {
    delete process.env.AUTH_API_KEY;
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).get("/api/v1/agents");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("supports a custom header name via AUTH_API_KEY_HEADER", async () => {
    process.env.AUTH_API_KEY_HEADER = "x-custom-auth";
    const { createApp: create } = await import("../src/app");
    const app = create();

    const resWrongHeader = await request(app)
      .get("/api/v1/agents")
      .set("x-api-key", TEST_KEY);

    expect(resWrongHeader.status).toBe(401);

    const resCorrectHeader = await request(app)
      .get("/api/v1/agents")
      .set("x-custom-auth", TEST_KEY);

    expect(resCorrectHeader.status).toBe(200);
  });
});
