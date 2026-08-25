import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("CORS policy", () => {
  const app = createApp();

  it("returns the standard 403 envelope for denied origins", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "https://denied.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Origin not allowed",
    });
  });

  it("preserves allowed-origin behavior", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://localhost:3000");

    expect(response.status).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
    expect(response.body.success).toBe(true);
  });
});
