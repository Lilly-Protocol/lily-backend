import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import {
  clearIdempotencyStore,
  _configureIdempotencyStore,
} from "../src/common/http/idempotency.middleware";
import { agentsService } from "../src/modules/agents/agents.service";

const app = createApp();

describe("Idempotency-Key middleware", () => {
  beforeEach(() => {
    _configureIdempotencyStore({
      ttlMs: 24 * 60 * 60 * 1000,
      maxEntries: 1000,
    });
    clearIdempotencyStore();
    agentsService.reset();
  });

  it("returns the original agent on replay with same key", async () => {
    const payload = {
      name: "Test Agent",
      description: "A test agent for idempotency checks",
      capabilities: ["testing"],
    };

    const first = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "key-001")
      .send(payload)
      .expect(201);

    const second = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "key-001")
      .send(payload)
      .expect(201);

    expect(second.body).toEqual(first.body);
    expect(second.body.data.agent.id).toBe(first.body.data.agent.id);

    const list = await request(app).get("/api/v1/agents").expect(200);
    expect(list.body.data.total).toBe(2);
  });

  it("creates separate agents when no key is provided", async () => {
    const payload = {
      name: "No Key Agent",
      description: "An agent without idempotency key header",
      capabilities: ["testing"],
    };

    const first = await request(app)
      .post("/api/v1/agents")
      .send(payload)
      .expect(201);

    const second = await request(app)
      .post("/api/v1/agents")
      .send(payload)
      .expect(201);

    expect(second.body.data.agent.id).not.toBe(first.body.data.agent.id);

    const list = await request(app).get("/api/v1/agents").expect(200);
    expect(list.body.data.total).toBe(3);
  });

  it("creates separate agents with different keys", async () => {
    const payload = {
      name: "Diff Key Agent",
      description: "An agent with different idempotency keys",
      capabilities: ["testing"],
    };

    const first = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "key-alpha")
      .send(payload)
      .expect(201);

    const second = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "key-beta")
      .send(payload)
      .expect(201);

    expect(second.body.data.agent.id).not.toBe(first.body.data.agent.id);
  });

  it("does not cache error responses", async () => {
    const badPayload = {
      name: "x",
      description: "too short",
      capabilities: [],
    };

    await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "key-err")
      .send(badPayload)
      .expect(400);

    await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "key-err")
      .send(badPayload)
      .expect(400);
  });

  it("ignores idempotency on GET requests (no caching)", async () => {
    await request(app)
      .get("/api/v1/agents")
      .set("Idempotency-Key", "key-get")
      .expect(200);

    await request(app)
      .get("/api/v1/agents")
      .set("Idempotency-Key", "key-get")
      .expect(200);
  });

  it("evicts the oldest entry when the store exceeds the configured cap", async () => {
    _configureIdempotencyStore({ maxEntries: 3, ttlMs: 60_000 });
    clearIdempotencyStore();

    const payload = {
      name: "Eviction Agent",
      description: "Testing store cap",
      capabilities: ["testing"],
    };

    await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "cap-key-1")
      .send({ ...payload, name: "First" })
      .expect(201);

    await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "cap-key-2")
      .send({ ...payload, name: "Second" })
      .expect(201);

    await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "cap-key-3")
      .send({ ...payload, name: "Third" })
      .expect(201);

    // Adding a fourth entry should evict the oldest (cap-key-1).
    await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "cap-key-4")
      .send({ ...payload, name: "Fourth" })
      .expect(201);

    // cap-key-2 and cap-key-3 should still be cached.
    const replay2 = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "cap-key-2")
      .send({ ...payload, name: "Second replay" })
      .expect(201);

    expect(replay2.body.data.agent.name).toBe("Second");

    const replay3 = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "cap-key-3")
      .send({ ...payload, name: "Third replay" })
      .expect(201);

    expect(replay3.body.data.agent.name).toBe("Third");

    // cap-key-1 should no longer be cached, so it creates a new agent.
    const replay1 = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "cap-key-1")
      .send({ ...payload, name: "First replay" })
      .expect(201);

    expect(replay1.body.data.agent.name).toBe("First replay");
  });

  it("expires entries older than the configured TTL", async () => {
    _configureIdempotencyStore({ ttlMs: 1, maxEntries: 1000 });
    clearIdempotencyStore();

    const payload = {
      name: "TTL Agent",
      description: "Testing TTL expiry",
      capabilities: ["testing"],
    };

    await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "ttl-key-1")
      .send({ ...payload, name: "TTL First" })
      .expect(201);

    // Wait slightly longer than the TTL for the entry to expire.
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Expired entry should not be replayed; a new agent is created.
    const replay = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", "ttl-key-1")
      .send({ ...payload, name: "TTL Replay" })
      .expect(201);

    expect(replay.body.data.agent.name).toBe("TTL Replay");
  });
});
