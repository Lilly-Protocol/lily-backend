import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { clearIdempotencyStore } from "../src/common/http/idempotency.middleware";
import { agentsService } from "../src/modules/agents/agents.service";

const app = createApp();

describe("Idempotency-Key middleware", () => {
  beforeEach(() => {
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

  it("does not cache 4xx error responses and allows retry with corrected payload (issue #284)", async () => {
    const key = "key-err-retry-001";
    const badPayload = {
      name: "x",
      description: "too short",
      capabilities: [],
    };
    const validPayload = {
      name: "Valid Agent",
      description: "A valid agent description for retry test",
      capabilities: ["testing"],
    };

    // First attempt fails schema validation with 400
    const errRes = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", key)
      .send(badPayload)
      .expect(400);

    expect(errRes.body.success).toBe(false);

    // Second attempt with SAME key and valid payload succeeds with 201
    const successRes = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", key)
      .send(validPayload)
      .expect(201);

    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.agent.name).toBe("Valid Agent");

    // Third attempt with SAME key replays cached 201 response
    const replayRes = await request(app)
      .post("/api/v1/agents")
      .set("Idempotency-Key", key)
      .send(validPayload)
      .expect(201);

    expect(replayRes.body).toEqual(successRes.body);
    expect(replayRes.body.data.agent.id).toBe(successRes.body.data.agent.id);

    // Verify only 1 agent was created (plus 1 seed agent = 2 total)
    const listRes = await request(app).get("/api/v1/agents").expect(200);
    expect(listRes.body.data.total).toBe(2);
  });
});
