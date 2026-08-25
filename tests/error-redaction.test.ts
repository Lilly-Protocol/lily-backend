import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

const buildErrorApp = async () => {
  const { errorHandler } = await import("../src/common/http/error.middleware");
  const { AppError } = await import("../src/common/http/app-error");
  const app = express();

  app.get("/generic-error", () => {
    throw new Error("sensitive internal details");
  });
  app.get("/application-error", (_request, _response, next) => {
    next(new AppError(503, "Service temporarily unavailable"));
  });
  app.use(errorHandler);

  return { app };
};

describe.sequential("error message redaction", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("passes through generic errors outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { app } = await buildErrorApp();

    const response = await request(app).get("/generic-error");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "sensitive internal details",
    });
  });

  it("redacts generic errors in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { app } = await buildErrorApp();

    const response = await request(app).get("/generic-error");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "Internal server error",
    });
  });

  it("preserves AppError messages in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { app } = await buildErrorApp();

    const response = await request(app).get("/application-error");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      success: false,
      message: "Service temporarily unavailable",
    });
  });
});
