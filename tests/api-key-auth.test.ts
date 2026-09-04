import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";


const TEST_KEY = "test-secret-key-12345";

const validAgentPayload = {
  name: "Auth Protected Agent",
  description: "Agent used to exercise mutating API key authentication",
  capabilities: ["payments"],
};

describe("API key authentication middleware (issue #263)", () => {
  let originalKey: string | undefined;
  let originalHeader: string | undefined;

  beforeEach(() => {
    originalKey = process.env.AUTH_API_KEY;
    originalHeader = process.env.AUTH_API_KEY_HEADER;
    process.env.AUTH_API_KEY = TEST_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.AUTH_API_KEY = originalKey;
    } else {
      delete process.env.AUTH_API_KEY;
    }
    if (originalHeader !== undefined) {
      process.env.AUTH_API_KEY_HEADER = originalHeader;
    } else {
      delete process.env.AUTH_API_KEY_HEADER;
    }
  });

  it("returns 401 when POST /api/v1/agents has no API key", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).post("/api/v1/agents").send(validAgentPayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("API key");
  });

  it("returns 403 when POST /api/v1/agents has an invalid API key", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app)
      .post("/api/v1/agents")
      .set("x-api-key", "wrong-key")
      .send(validAgentPayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid");
  });

  it("allows POST /api/v1/agents through when the correct API key is provided", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app)
      .post("/api/v1/agents")
      .set("x-api-key", TEST_KEY)
      .send(validAgentPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("keeps GET /api/v1/agents public when AUTH_API_KEY is set", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).get("/api/v1/agents");

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
    const { logger } = await import("../src/config/logger");
    const warn = vi.spyOn(logger, "warn");
    try {
      const { createApp: create } = await import("../src/app");
      const app = create();

      const first = await request(app).post("/api/v1/agents").send(validAgentPayload);
      const second = await request(app).post("/api/v1/agents").send({
        ...validAgentPayload,
        name: "Second Unconfigured Agent",
      });

      expect(first.status).toBe(201);
      expect(first.body.success).toBe(true);
      expect(second.status).toBe(201);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toContain("AUTH_API_KEY is not set");
    } finally {
      warn.mockRestore();
    }
  });

  it("supports a custom header name via AUTH_API_KEY_HEADER", async () => {
    process.env.AUTH_API_KEY_HEADER = "x-custom-auth";
    const { createApp: create } = await import("../src/app");
    const app = create();

    const resWrongHeader = await request(app)
      .post("/api/v1/agents")
      .set("x-api-key", TEST_KEY)
      .send(validAgentPayload);

    expect(resWrongHeader.status).toBe(401);

    const resCorrectHeader = await request(app)
      .post("/api/v1/agents")
      .set("x-custom-auth", TEST_KEY)
      .send({
        ...validAgentPayload,
        name: "Custom Header Agent",
      });

    expect(resCorrectHeader.status).toBe(201);
  });
});
