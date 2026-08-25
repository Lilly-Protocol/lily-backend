import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Malformed JSON body returns 400 (issue #142)", () => {
  const app = createApp();

  it("should return 400 for invalid JSON syntax", async () => {
    const res = await request(app)
      .post("/api/v1/agents")
      .set("Content-Type", "application/json")
      .send("{invalid json}");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for truncated JSON", async () => {
    const res = await request(app)
      .post("/api/v1/agents")
      .set("Content-Type", "application/json")
      .send('{"name": "test"');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for empty body with JSON content-type", async () => {
    const res = await request(app)
      .post("/api/v1/agents")
      .set("Content-Type", "application/json")
      .send("");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should include error details in the response envelope", async () => {
    const res = await request(app)
      .post("/api/v1/agents")
      .set("Content-Type", "application/json")
      .send("not json at all");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });
});
