import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { agentsService } from "../src/modules/agents/agents.service";

describe("agent endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    agentsService.reset();
  });

  it("returns seeded agents so contributors can inspect a real module", async () => {
    const response = await request(app).get("/api/v1/agents");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.agents[0]).toMatchObject({
      id: "agentlily_demo_001",
      name: "Treasury Settlement Agent",
      walletAddress: expect.stringMatching(/^G[A-Z0-9]+$/),
      status: "active",
    });
  });

  it("creates an agent with validated input", async () => {
    const response = await request(app).post("/api/v1/agents").send({
      name: "Liquidity Bot",
      description:
        "AgentLily responsible for orchestrating liquidity and payment workflows.",
      capabilities: ["liquidity-management", "payments"],
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.agent).toMatchObject({
      id: "agentlily_2",
      name: "Liquidity Bot",
      description:
        "AgentLily responsible for orchestrating liquidity and payment workflows.",
      status: "active",
      capabilities: ["liquidity-management", "payments"],
    });
    expect(response.body.data.agent.walletAddress).toMatch(/^GLIQUIDITYBOT0+/);
  });

  it("persists a created agent in the list endpoint", async () => {
    await request(app).post("/api/v1/agents").send({
      name: "Marketplace Runner",
      description:
        "AgentLily responsible for purchasing tools and settling marketplace invoices.",
      capabilities: ["marketplace-purchases", "settlement"],
    });

    const response = await request(app).get("/api/v1/agents");

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.agents[1]).toMatchObject({
      id: "agentlily_2",
      name: "Marketplace Runner",
    });
  });

  it("rejects invalid agent payloads with typed validation errors", async () => {
    const response = await request(app).post("/api/v1/agents").send({
      name: "A",
      description: "too short",
      capabilities: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      name: [expect.any(String)],
      description: [expect.any(String)],
      capabilities: [expect.any(String)],
    });
  });

  // GET /:id tests (issue #113)

  it("returns a single agent by id", async () => {
    const response = await request(app).get("/api/v1/agents/agentlily_demo_001");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.agent).toMatchObject({
      id: "agentlily_demo_001",
      name: "Treasury Settlement Agent",
    });
  });

  it("returns 404 for unknown agent id on GET", async () => {
    const response = await request(app).get("/api/v1/agents/nonexistent_id");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("not found");
  });

  // PATCH /:id tests (issue #114)

  it("patches agent status to paused", async () => {
    const response = await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "paused" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.agent.status).toBe("paused");
  });

  it("patches agent status back to active", async () => {
    await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "paused" });

    const response = await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "active" });

    expect(response.status).toBe(200);
    expect(response.body.data.agent.status).toBe("active");
  });

  it("returns 400 for invalid status value on PATCH", async () => {
    const response = await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "invalid_status" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("returns 404 for unknown agent id on PATCH", async () => {
    const response = await request(app)
      .patch("/api/v1/agents/nonexistent_id")
      .send({ status: "paused" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  // DELETE /:id tests (issue #115)

  it("deletes an existing agent", async () => {
    const response = await request(app).delete(
      "/api/v1/agents/agentlily_demo_001",
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain("deleted");
  });

  it("deleted agent no longer appears in the list", async () => {
    await request(app).delete("/api/v1/agents/agentlily_demo_001");

    const response = await request(app).get("/api/v1/agents");

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(0);
    expect(
      response.body.data.agents.find(
        (a: { id: string }) => a.id === "agentlily_demo_001",
      ),
    ).toBeUndefined();
  });

  it("returns 404 for unknown agent id on DELETE", async () => {
    const response = await request(app).delete(
      "/api/v1/agents/nonexistent_id",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
