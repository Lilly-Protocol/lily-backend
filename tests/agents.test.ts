import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { agentsService } from "../src/modules/agents/agents.service";
import type { CreateAgentInput } from "../src/modules/agents/agents.types";

const buildAgentPayload = (
  overrides: Partial<CreateAgentInput> = {},
): CreateAgentInput => ({
  name: "Liquidity Bot",
  description:
    "AgentLily responsible for orchestrating liquidity and payment workflows.",
  capabilities: ["liquidity-management", "payments"],
  ...overrides,
});

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

  it("returns a list envelope whose total matches the number of agents", async () => {
    const response = await request(app).get("/api/v1/agents");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.agents)).toBe(true);
    expect(response.body.data.total).toBe(response.body.data.agents.length);
  });

  it("creates an agent with validated input", async () => {
    const response = await request(app)
      .post("/api/v1/agents")
      .send(buildAgentPayload());

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

  it("derives a stellar-style wallet address from the agent name", async () => {
    const response = await request(app)
      .post("/api/v1/agents")
      .send(
        buildAgentPayload({
          name: "R&D Ops Bot!",
          capabilities: ["settlement"],
        }),
      );

    const { walletAddress } = response.body.data.agent;

    expect(walletAddress).toMatch(/^G[A-Z0-9]{55}$/);
    expect(walletAddress.slice(1, 11)).toBe("RDOPSBOT00");
  });

  it("assigns sequential ids and persists created agents in order", async () => {
    const first = await request(app)
      .post("/api/v1/agents")
      .send(buildAgentPayload());
    const second = await request(app)
      .post("/api/v1/agents")
      .send(
        buildAgentPayload({
          name: "Marketplace Runner",
          description:
            "AgentLily responsible for purchasing tools and settling marketplace invoices.",
          capabilities: ["marketplace-purchases", "settlement"],
        }),
      );

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.data.agent.id).toBe("agentlily_2");
    expect(second.body.data.agent.id).toBe("agentlily_3");
    expect(Date.parse(first.body.data.agent.createdAt)).not.toBeNaN();
    expect(Date.parse(second.body.data.agent.createdAt)).not.toBeNaN();

    const response = await request(app).get("/api/v1/agents");

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(3);
    expect(
      response.body.data.agents.map((agent: { id: string }) => agent.id),
    ).toEqual(["agentlily_demo_001", "agentlily_2", "agentlily_3"]);
    expect(response.body.data.agents[2]).toMatchObject({
      name: "Marketplace Runner",
      capabilities: ["marketplace-purchases", "settlement"],
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

  it("rejects an empty payload with field errors for every required field", async () => {
    const response = await request(app).post("/api/v1/agents").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(Object.keys(response.body.details.fieldErrors).sort()).toEqual([
      "capabilities",
      "description",
      "name",
    ]);
  });

  it("rejects payloads with wrongly typed values", async () => {
    const response = await request(app).post("/api/v1/agents").send({
      name: 42,
      description: true,
      capabilities: "payments",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Object.keys(response.body.details.fieldErrors).sort()).toEqual([
      "capabilities",
      "description",
      "name",
    ]);
  });

  it("rejects more capabilities than the schema allows", async () => {
    const response = await request(app)
      .post("/api/v1/agents")
      .send(
        buildAgentPayload({
          capabilities: Array.from(
            { length: 11 },
            (_, index) => `capability-${index + 1}`,
          ),
        }),
      );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.details.fieldErrors.capabilities).toBeDefined();
  });
});
