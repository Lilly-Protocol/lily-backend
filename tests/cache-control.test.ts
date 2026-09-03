import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { apiRouter } from "../src/routes";

describe("Cache-Control: no-store (issue #76)", () => {
  const app = createApp();

  it("should set Cache-Control: no-store on root route", async () => {
    const res = await request(app).get("/");
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("should set Cache-Control: no-store on health endpoint", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("should set Cache-Control: no-store on agents endpoint", async () => {
    const res = await request(app).get("/api/v1/agents");
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("should set Cache-Control: no-store on successful writes", async () => {
    const res = await request(app).post("/api/v1/agents").send({
      name: "Cache Control Agent",
      description: "Agent created to verify write-response cache headers.",
      capabilities: ["payments"],
    });

    expect(res.status).toBe(201);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("should set Cache-Control: no-store on validation errors", async () => {
    const res = await request(app).post("/api/v1/agents").send({
      name: "x",
      description: "short",
      capabilities: [],
    });

    expect(res.status).toBe(400);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("should set Cache-Control: no-store on unhandled server errors", async () => {
    apiRouter.get("/cache-control-error-trigger", () => {
      throw new Error("Simulated cache-control failure");
    });

    const res = await request(app).get("/api/v1/cache-control-error-trigger");
    expect(res.status).toBe(500);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("should set Cache-Control: no-store on 404 responses", async () => {
    const res = await request(app).get("/nonexistent-route");
    expect(res.headers["cache-control"]).toBe("no-store");
  });
});
