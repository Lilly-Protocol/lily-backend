import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Root route response shape (issue #141)", () => {
  const app = createApp();

  it("should return 200 with success: true", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should include a message string", async () => {
    const res = await request(app).get("/");
    expect(typeof res.body.message).toBe("string");
    expect(res.body.message.length).toBeGreaterThan(0);
  });

  it("should include docs pointing to the health endpoint", async () => {
    const res = await request(app).get("/");
    expect(typeof res.body.docs).toBe("string");
    expect(res.body.docs).toContain("/health");
  });

  it("should not use the standard data envelope shape", async () => {
    const res = await request(app).get("/");
    // Root route intentionally uses {success, message, docs} instead of {success, data}
    expect(res.body.data).toBeUndefined();
  });
});
