import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { stopEventLoopLagSampler } from "../src/modules/metrics/event-loop-lag";

describe("metrics endpoints", () => {
  const app = createApp();

  afterAll(() => {
    stopEventLoopLagSampler();
  });

  it("returns process metrics and telemetry data including eventLoopLagMs", async () => {
    const response = await request(app).get("/api/v1/metrics");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      uptimeSeconds: expect.any(Number),
      eventLoopLagMs: expect.any(Number),
      memoryUsage: {
        rssBytes: expect.any(Number),
        heapTotalBytes: expect.any(Number),
        heapUsedBytes: expect.any(Number),
        externalBytes: expect.any(Number),
      },
      nodeVersion: expect.stringMatching(/^v\d+/),
      environment: expect.any(String),
      timestamp: expect.any(String),
    });
    expect(Number.isFinite(response.body.data.eventLoopLagMs)).toBe(true);
    expect(response.body.data.eventLoopLagMs).toBeGreaterThanOrEqual(0);
  });
});
