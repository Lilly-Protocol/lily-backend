import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("health endpoints", () => {
  const app = createApp();

  it("returns the full health payload contract", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.service).toBeDefined();
    expect(typeof response.body.data.service).toBe("string");
    expect(response.body.data.environment).toBeDefined();
    expect(typeof response.body.data.environment).toBe("string");
    expect(response.body.data.timestamp).toBeDefined();
    expect(new Date(response.body.data.timestamp).toISOString()).toBe(
      response.body.data.timestamp
    );
  });
  it("returns the service health payload", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });

  it("returns a typed 404 payload for missing routes", async () => {
    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Route not found");
  });
});
