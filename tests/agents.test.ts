import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { agentsService } from "../src/modules/agents/agents.service";

describe("agent endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    agentsService.reset();
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

  describe("AC2: Test create validation failure", () => {
    it("rejects agent with name too short (< 2 chars)", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "A",
        description: "Valid description for testing.",
        capabilities: ["test"],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Request validation failed");
      expect(response.body.details.fieldErrors.name).toBeDefined();
    });

    it("rejects agent with name too long (> 80 chars)", async () => {
      const longName = "A".repeat(81);
      const response = await request(app).post("/api/v1/agents").send({
        name: longName,
        description: "Valid description for testing.",
        capabilities: ["test"],
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.name).toBeDefined();
    });

    it("rejects agent with description too short (< 10 chars)", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
        description: "too short",
        capabilities: ["test"],
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.description).toBeDefined();
    });

    it("rejects agent with description too long (> 280 chars)", async () => {
      const longDescription = "A".repeat(281);
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
        description: longDescription,
        capabilities: ["test"],
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.description).toBeDefined();
    });

    it("rejects agent with empty capabilities array", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
        description: "Valid description for testing.",
        capabilities: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.capabilities).toBeDefined();
    });

    it("rejects agent with too many capabilities (> 10)", async () => {
      const excessCapabilities = Array.from({ length: 11 }, (_, i) => `capability-${i}`);
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
        description: "Valid description for testing.",
        capabilities: excessCapabilities,
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.capabilities).toBeDefined();
    });

    it("rejects agent with capability string too short (< 2 chars)", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
        description: "Valid description for testing.",
        capabilities: ["a"],
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.capabilities).toBeDefined();
    });

    it("rejects agent with capability string too long (> 50 chars)", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
        description: "Valid description for testing.",
        capabilities: ["A".repeat(51)],
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.capabilities).toBeDefined();
    });

    it("rejects payload missing required fields", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "Valid Agent",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("rejects payload with null values", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: null,
        description: "Valid description for testing.",
        capabilities: ["test"],
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("provides clear, typed validation error structure", async () => {
      const response = await request(app).post("/api/v1/agents").send({
        name: "A",
        description: "short",
        capabilities: [],
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors).toHaveProperty("name");
      expect(response.body.details.fieldErrors).toHaveProperty("description");
      expect(response.body.details.fieldErrors).toHaveProperty("capabilities");
      expect(Array.isArray(response.body.details.fieldErrors.name)).toBe(true);
      expect(response.body.details.fieldErrors.name[0]).toBeDefined();
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

    it("persists created agents in list and increments total count", async () => {
      await request(app).post("/api/v1/agents").send({
        name: "Marketplace Runner",
        description:
          "AgentLily responsible for purchasing tools and settling marketplace invoices.",
        capabilities: ["marketplace-purchases", "settlement"],
      });

      const response = await request(app).get("/api/v1/agents");

      expect(response.status).toBe(200);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.agents).toHaveLength(2);
      expect(response.body.data.agents[1]).toMatchObject({
        id: "agentlily_2",
        name: "Marketplace Runner",
      });
    });

    it("maintains agent order (seeded agents first, then created)", async () => {
      const createResponse1 = await request(app).post("/api/v1/agents").send({
        name: "First Created Agent",
        description: "This agent was created first in the test.",
        capabilities: ["capability-1"],
      });

      const createResponse2 = await request(app).post("/api/v1/agents").send({
        name: "Second Created Agent",
        description: "This agent was created second in the test.",
        capabilities: ["capability-2"],
      });

      const listResponse = await request(app).get("/api/v1/agents");

      expect(listResponse.body.data.agents[0].name).toBe("Treasury Settlement Agent");
      expect(listResponse.body.data.agents[1].name).toBe("First Created Agent");
      expect(listResponse.body.data.agents[2].name).toBe("Second Created Agent");
    });

    it("returns agents with complete and valid structure", async () => {
      const response = await request(app).get("/api/v1/agents");

      const agent = response.body.data.agents[0];
      expect(agent).toHaveProperty("id");
      expect(agent).toHaveProperty("name");
      expect(agent).toHaveProperty("description");
      expect(agent).toHaveProperty("walletAddress");
      expect(agent).toHaveProperty("status");
      expect(agent).toHaveProperty("capabilities");
      expect(agent).toHaveProperty("createdAt");

      expect(typeof agent.id).toBe("string");
      expect(typeof agent.name).toBe("string");
      expect(typeof agent.description).toBe("string");
      expect(typeof agent.walletAddress).toBe("string");
      expect(["active", "paused"]).toContain(agent.status);
      expect(Array.isArray(agent.capabilities)).toBe(true);
      expect(!isNaN(Date.parse(agent.createdAt))).toBe(true);
    });

    it("returns typed ListAgentsResponse with agents array and total", async () => {
      const response = await request(app).get("/api/v1/agents");

      expect(response.body.data).toHaveProperty("agents");
      expect(response.body.data).toHaveProperty("total");
      expect(Array.isArray(response.body.data.agents)).toBe(true);
      expect(typeof response.body.data.total).toBe("number");
      expect(response.body.data.total).toBe(response.body.data.agents.length);
    });
  });

  describe("AC4: Tests pass in CI", () => {
    it("all happy path tests pass", async () => {
      const createResponse = await request(app).post("/api/v1/agents").send({
        name: "CI Test Agent",
        description: "An agent created during CI test validation.",
        capabilities: ["ci-testing"],
      });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);

      const listResponse = await request(app).get("/api/v1/agents");

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.total).toBeGreaterThan(0);
    });
  });
});