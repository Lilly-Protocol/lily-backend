import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("health endpoints", () => {
  const app = createApp();

  describe("GET /api/v1/health", () => {
    it("returns the service health payload", async () => {
      const response = await request(app).get("/api/v1/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("ok");
      expect(response.body.data.service).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe("GET /api/v1/health/live", () => {
    it("returns a liveness payload", async () => {
      const response = await request(app).get("/api/v1/health/live");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("ok");
      expect(response.body.data.service).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    it("does not include environment in liveness", async () => {
      const response = await request(app).get("/api/v1/health/live");

      expect(response.body.data).not.toHaveProperty("environment");
    });
  });

  describe("GET /api/v1/health/ready", () => {
    it("returns a readiness payload with dependency checks", async () => {
      const response = await request(app).get("/api/v1/health/ready");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("ok");
      expect(response.body.data.service).toBeDefined();
      expect(response.body.data.environment).toBeDefined();
      expect(response.body.data.checks).toBeDefined();
      expect(response.body.data.checks.dependencies).toBe("ok");
      expect(response.body.data.timestamp).toBeDefined();
    });

    it("includes a checks object with dependency status", async () => {
      const response = await request(app).get("/api/v1/health/ready");

      expect(response.body.data.checks).toEqual({
        dependencies: "ok",
      });
    });
  });

  it("returns a typed 404 payload for missing routes", async () => {
    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Route not found");
  });
});
