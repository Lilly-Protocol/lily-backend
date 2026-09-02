import type { Express } from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "@/app";
import { agentsService } from "@/modules/agents/agents.service";

describe("agent endpoints", () => {
  let app: Express;

  beforeEach(async () => {
    app = await createIsolatedTestApp();
  });

  it("does not expose test-only reset behavior from the production service", async () => {
    const { agentsService } = await import(
      "../src/modules/agents/agents.service"
    );

    expect(agentsService).not.toHaveProperty("reset");
  });

  describe("AC1: Test create agent happy path", () => {
    it("creates an agent with valid input and returns 201", async () => {
      const payload = {
        name: "Liquidity Bot",
        description:
          "AgentLily responsible for orchestrating liquidity and payment workflows.",
        capabilities: ["liquidity-management", "payments"],
      };

      const response = await request(app)
        .post("/api/v1/agents")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.agent).toMatchObject({
        id: "agentlily_2",
        name: payload.name,
        description: payload.description,
        status: "active",
        capabilities: payload.capabilities,
      });
      expect(response.body.data.agent.walletAddress).toMatch(/^GLIQUIDITYBOT0+/);
      expect(response.body.data.agent.createdAt).toBeDefined();
    });

    it("generates deterministic wallet address from agent name", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Treasury Bot",
        description: "Handles treasury operations and settlements.",
        capabilities: ["treasury-management"],
      });

      expect(response.status).toBe(201);
      expect(response.body.data.agent.walletAddress).toMatch(/^GTREASURYBOT0+/);
    });

    it("accepts minimal valid capabilities array", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Simple Agent",
        description: "A minimal agent with single capability.",
        capabilities: ["basic-operation"],
      });

      expect(response.status).toBe(201);
      expect(response.body.data.agent.capabilities).toEqual(["basic-operation"]);
    });

    it("accepts maximum valid capabilities count", async () => {
      const maxCapabilities = Array.from({ length: 10 }, (_, i) => `capability-${i}`);
      const response = await request(app).post("/api/v1/agents").send({
        name: "Full Featured Agent",
        description: "An agent with the maximum number of capabilities allowed.",
        capabilities: maxCapabilities,
      });

      expect(response.status).toBe(201);
      expect(response.body.data.agent.capabilities).toHaveLength(10);
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
    const response = await request(app).post("/api/v1/agents").send({
      name: "Liquidity Bot",
      description:
        "AgentLily responsible for orchestrating liquidity and payment workflows.",
      capabilities: ["usdc-payments", "payments"],
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.agent).toMatchObject({
      id: "agentlily_2",
      name: "Liquidity Bot",
      description:
        "AgentLily responsible for orchestrating liquidity and payment workflows.",
      status: "active",
      capabilities: ["usdc-payments", "payments"],
    });
    expect(response.body.data.agent.walletAddress).toMatch(/^GLIQUIDITYBOT0+/);
  });

  it("persists a created agent in the list endpoint", async () => {
    await request(app).post("/api/v1/agents").send({
      name: "Marketplace Runner",
      description:
        "AgentLily responsible for purchasing tools and settling marketplace invoices.",
      capabilities: ["settlement", "settlement"],
    });

    it("rejects agent with description too short (< 10 chars)", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
        description: "too short",
        capabilities: ["test"],
      });

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

  it("rejects unknown keys in agent creation payloads", async () => {
    const response = await request(app)
      .post("/api/v1/agents")
      .send({
        name: "Treasury Bot",
        description:
          "AgentLily responsible for treasury management and payment routing.",
        capabilities: ["treasury-management"],
        admin: true,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      admin: [expect.stringContaining("Unrecognized key")],
    });
  });

  describe("AC3: Test list agents happy path", () => {
    it("returns seeded agents on initial list request", async () => {
      const response = await request(app).get("/api/v1/agents");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(1);
      expect(response.body.data.agents).toHaveLength(1);
      expect(response.body.data.agents[0]).toMatchObject({
        id: "agentlily_demo_001",
        name: "Treasury Settlement Agent",
        status: "active",
      });
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      name: [expect.any(String)],
      description: [expect.any(String)],
      capabilities: [expect.any(String)],
    });
  });

  it("pauses an existing agent", async () => {
    const response = await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "paused" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.agent.id).toBe("agentlily_demo_001");
    expect(response.body.data.agent.status).toBe("paused");
  });

  it("resumes the same agent", async () => {
    await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "active" });

    const response = await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "active" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.agent.status).toBe("active");
  });

  it("rejects invalid status with 400", async () => {
    const response = await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "disabled" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
  });

  it("returns 404 for unknown agent ID", async () => {
    const response = await request(app)
      .patch("/api/v1/agents/does-not-exist")
      .send({ status: "paused" });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("persists status change in the list endpoint", async () => {
    await request(app)
      .patch("/api/v1/agents/agentlily_demo_001")
      .send({ status: "paused" });

    const response = await request(app).get("/api/v1/agents");

    expect(response.status).toBe(200);
    expect(response.body.data.agents[0]).toMatchObject({
      id: "agentlily_demo_001",
      status: "paused",
    });
  });
});

