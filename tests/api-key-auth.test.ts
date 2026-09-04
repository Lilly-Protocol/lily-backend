import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";

const TEST_KEY = "test-secret-key-12345";

const VALID_AGENT = {
  name: "Auth Routing Agent",
  description: "Agent used to exercise write-route authentication",
  capabilities: ["test"],
};

describe("API key authentication on write routes (issue #263)", () => {
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
    delete process.env.AUTH_API_KEY_HEADER;
  });

  it("returns 401 on a write route when no API key is provided", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).post("/api/v1/agents").send(VALID_AGENT);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("API key");
  });

  it("returns 403 on a write route when an invalid API key is provided", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app)
      .post("/api/v1/agents")
      .set("x-api-key", "wrong-key")
      .send(VALID_AGENT);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid");
  });

  it("allows a write route through with the correct API key", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app)
      .post("/api/v1/agents")
      .set("x-api-key", TEST_KEY)
      .send(VALID_AGENT);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("keeps agent reads public even when an API key is configured", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).get("/api/v1/agents");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("keeps health public without requiring an API key", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("keeps quote lookup public but quote writes authenticated", async () => {
    const { createApp: create } = await import("../src/app");
    const app = create();

    const readRes = await request(app).get("/api/v1/payments/quotes/quote_any");
    expect(readRes.status).toBe(404);
    expect(readRes.body.message).toBe("Quote not found");

    const writeRes = await request(app).post("/api/v1/payments").send({
      sourceAsset: "USDC",
      destinationAsset: "XLM",
      sourceAmount: "10.00",
    });
    expect(writeRes.status).toBe(401);

    const executeRes = await request(app)
      .post("/api/v1/payments/execute")
      .send({ quoteId: "quote_any", confirmed: true });
    expect(executeRes.status).toBe(401);
  });

  it("disables auth with a warning when AUTH_API_KEY is not set", async () => {
    delete process.env.AUTH_API_KEY;
    const { createApp: create } = await import("../src/app");
    const app = create();

    const res = await request(app).post("/api/v1/agents").send(VALID_AGENT);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("supports a custom header name via AUTH_API_KEY_HEADER", async () => {
    process.env.AUTH_API_KEY_HEADER = "x-custom-auth";
    const { createApp: create } = await import("../src/app");
    const app = create();

    const resWrongHeader = await request(app)
      .post("/api/v1/agents")
      .set("x-api-key", TEST_KEY)
      .send(VALID_AGENT);

    expect(resWrongHeader.status).toBe(401);

    const resCorrectHeader = await request(app)
      .post("/api/v1/agents")
      .set("x-custom-auth", TEST_KEY)
      .send(VALID_AGENT);

    expect(resCorrectHeader.status).toBe(201);
  });
});
