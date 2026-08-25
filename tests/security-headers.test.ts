import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("Security headers set by helmet (issue #135)", () => {
  const app = createApp();

  it("should include X-Content-Type-Options: nosniff", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("should include Content-Security-Policy header", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["content-security-policy"]).toBeDefined();
    expect(typeof res.headers["content-security-policy"]).toBe("string");
  });

  it("should not include X-Powered-By header", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("should include Cross-Origin-Resource-Policy: cross-origin (intentional override)", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });

  it("should include Referrer-Policy header", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["referrer-policy"]).toBeDefined();
  });

  it("should include X-Frame-Options header", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });
});
