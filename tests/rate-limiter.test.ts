import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import rateLimit from "express-rate-limit";

describe("API rate limiter 429 response (issue #126)", () => {
  const createLimitedApp = () => {
    const app = express();
    app.use(
      rateLimit({
        windowMs: 60_000,
        limit: 3,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: "Too many requests, please try again later.",
        },
      }),
    );
    app.get("/test", (_req, res) => {
      res.json({ success: true });
    });
    return app;
  };

  it("should allow requests under the limit", async () => {
    const app = createLimitedApp();
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 429 after exceeding the limit", async () => {
    const app = createLimitedApp();

    for (let i = 0; i < 3; i++) {
      await request(app).get("/test");
    }

    const res = await request(app).get("/test");
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Too many requests, please try again later.");
  });

  it("should include RateLimit headers on responses", async () => {
    const app = createLimitedApp();
    const res = await request(app).get("/test");

    expect(res.headers["ratelimit-limit"]).toBeDefined();
    expect(res.headers["ratelimit-remaining"]).toBeDefined();
    expect(res.headers["ratelimit-reset"]).toBeDefined();
  });

  it("should include RateLimit headers on 429 responses", async () => {
    const app = createLimitedApp();

    for (let i = 0; i < 3; i++) {
      await request(app).get("/test");
    }

    const res = await request(app).get("/test");
    expect(res.status).toBe(429);
    expect(res.headers["ratelimit-limit"]).toBeDefined();
    expect(res.headers["ratelimit-remaining"]).toBeDefined();
    expect(res.headers["ratelimit-reset"]).toBeDefined();
  });
});
