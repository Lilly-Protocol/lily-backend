import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("405 Method Not Allowed handling (issue #131)", () => {
  const app = createApp();

  it("should return 405 for POST to health endpoint", async () => {
    const res = await request(app).post("/api/v1/health");
    expect(res.status).toBe(405);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Method not allowed");
  });

  it("should return 405 for PUT to agents list endpoint", async () => {
    const res = await request(app).put("/api/v1/agents");
    expect(res.status).toBe(405);
    expect(res.body.success).toBe(false);
  });

  it("should return 405 for DELETE to health endpoint", async () => {
    const res = await request(app).delete("/api/v1/health");
    expect(res.status).toBe(405);
    expect(res.body.success).toBe(false);
  });

  it("should still return 404 for truly missing routes", async () => {
    const res = await request(app).get("/api/v1/nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
