import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("CORS origin handling", () => {
  const app = createApp();

  it("rejects an origin outside CORS_ORIGINS with the standard error envelope", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "https://not-allowed.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Origin not allowed by CORS",
    });
  });

  it("allows requests without an Origin header", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok" },
    });
  });
});
