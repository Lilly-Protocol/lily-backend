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

  it("generates deterministic ids across service resets", async () => {
    // Note: createAgent derives ids as `agentlily_${agentsStore.length + 1}`.
    // Because reset() restores the seed, the first created agent after each
    // reset is expected to be `agentlily_2` (1 seeded agent + 1).

    // First cycle: create two agents.
    const firstCycle = await Promise.all([
      request(app).post("/api/v1/agents").send({
        name: "First Cycle Agent One",
        description: "First cycle agent one for deterministic id test.",
        capabilities: ["capability-a"],
      }),
      request(app).post("/api/v1/agents").send({
        name: "First Cycle Agent Two",
        description: "First cycle agent two for deterministic id test.",
        capabilities: ["capability-b"],
      }),
    ]);

    expect(firstCycle[0].body.data.agent.id).toBe("agentlily_2");
    expect(firstCycle[1].body.data.agent.id).toBe("agentlily_3");

    // Reset the store and create two agents again.
    agentsService.reset();

    const secondCycle = await Promise.all([
      request(app).post("/api/v1/agents").send({
        name: "Second Cycle Agent One",
        description: "Second cycle agent one for deterministic id test.",
        capabilities: ["capability-c"],
      }),
      request(app).post("/api/v1/agents").send({
        name: "Second Cycle Agent Two",
        description: "Second cycle agent two for deterministic id test.",
        capabilities: ["capability-d"],
      }),
    ]);

    expect(secondCycle[0].body.data.agent.id).toBe("agentlily_2");
    expect(secondCycle[1].body.data.agent.id).toBe("agentlily_3");
  });
});
