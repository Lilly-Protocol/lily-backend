import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { metricsService } from "../src/modules/metrics/metrics.service";

describe("metrics endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    metricsService.resetMetrics();
  });

  it("returns process metrics and telemetry data", async () => {
    const response = await request(app).get("/api/v1/metrics");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      uptimeSeconds: expect.any(Number),
      memoryUsage: {
        rssBytes: expect.any(Number),
        heapTotalBytes: expect.any(Number),
        heapUsedBytes: expect.any(Number),
        externalBytes: expect.any(Number),
      },
      nodeVersion: expect.stringMatching(/^v\d+/),
      environment: expect.any(String),
      timestamp: expect.any(String),
      requestCount: expect.any(Number),
      totalDurationMs: expect.any(Number),
      statusCodes: {
        "1xx": expect.any(Number),
        "2xx": expect.any(Number),
        "3xx": expect.any(Number),
        "4xx": expect.any(Number),
        "5xx": expect.any(Number),
      },
      methods: expect.any(Object),
    });
  });

  it("increments requestCount, method count, and 2xx count on /api/v1 route requests", async () => {
    // Initial request triggers recording upon finish
    const initialResponse = await request(app).get("/api/v1/metrics");
    expect(initialResponse.status).toBe(200);

    // Next request to metrics exposes recorded metrics
    const responseAfterFirst = await request(app).get("/api/v1/metrics");
    expect(responseAfterFirst.status).toBe(200);
    expect(responseAfterFirst.body.data.requestCount).toBeGreaterThanOrEqual(1);
    expect(
      responseAfterFirst.body.data.statusCodes["2xx"],
    ).toBeGreaterThanOrEqual(1);
    expect(responseAfterFirst.body.data.methods.GET).toBeGreaterThanOrEqual(1);
    expect(responseAfterFirst.body.data.totalDurationMs).toBeGreaterThan(0);
  });

  it("increments 4xx counter and grows totalDurationMs on 404 requests", async () => {
    const notFoundRes = await request(app).get("/api/v1/nonexistent-route");
    expect(notFoundRes.status).toBe(404);

    const metricsRes = await request(app).get("/api/v1/metrics");
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.data.statusCodes["4xx"]).toBeGreaterThanOrEqual(1);
    expect(metricsRes.body.data.requestCount).toBeGreaterThanOrEqual(1);
    expect(metricsRes.body.data.totalDurationMs).toBeGreaterThan(0);

    const prevDuration = metricsRes.body.data.totalDurationMs;
    const prevCount = metricsRes.body.data.requestCount;

    await request(app).get("/api/v1/another-404");

    const secondMetricsRes = await request(app).get("/api/v1/metrics");
    expect(secondMetricsRes.body.data.statusCodes["4xx"]).toBeGreaterThan(
      metricsRes.body.data.statusCodes["4xx"],
    );
    expect(secondMetricsRes.body.data.requestCount).toBeGreaterThan(prevCount);
    expect(secondMetricsRes.body.data.totalDurationMs).toBeGreaterThanOrEqual(
      prevDuration,
    );
  });

  it("tracks different HTTP methods accurately", async () => {
    await request(app).post("/api/v1/nonexistent").send({});

    const metricsRes = await request(app).get("/api/v1/metrics");
    expect(metricsRes.body.data.methods.POST).toBeGreaterThanOrEqual(1);
  });
});

describe("metricsService unit tests", () => {
  beforeEach(() => {
    metricsService.resetMetrics();
  });

  it("categorizes all status code ranges (1xx, 2xx, 3xx, 4xx, 5xx) properly", () => {
    metricsService.recordRequest("GET", 101, 5.5);
    metricsService.recordRequest("POST", 200, 10.2);
    metricsService.recordRequest("PUT", 301, 15.1);
    metricsService.recordRequest("DELETE", 400, 20.0);
    metricsService.recordRequest("PATCH", 500, 25.3);

    const metrics = metricsService.getMetrics();
    expect(metrics.requestCount).toBe(5);
    expect(metrics.statusCodes["1xx"]).toBe(1);
    expect(metrics.statusCodes["2xx"]).toBe(1);
    expect(metrics.statusCodes["3xx"]).toBe(1);
    expect(metrics.statusCodes["4xx"]).toBe(1);
    expect(metrics.statusCodes["5xx"]).toBe(1);

    expect(metrics.methods.GET).toBe(1);
    expect(metrics.methods.POST).toBe(1);
    expect(metrics.methods.PUT).toBe(1);
    expect(metrics.methods.DELETE).toBe(1);
    expect(metrics.methods.PATCH).toBe(1);

    expect(metrics.totalDurationMs).toBeCloseTo(76.1, 1);
  });

  it("resets state completely on resetMetrics()", () => {
    metricsService.recordRequest("GET", 200, 10);
    metricsService.resetMetrics();

    const metrics = metricsService.getMetrics();
    expect(metrics.requestCount).toBe(0);
    expect(metrics.totalDurationMs).toBe(0);
    expect(metrics.statusCodes).toEqual({
      "1xx": 0,
      "2xx": 0,
      "3xx": 0,
      "4xx": 0,
      "5xx": 0,
    });
    expect(metrics.methods).toEqual({});
  });
});
