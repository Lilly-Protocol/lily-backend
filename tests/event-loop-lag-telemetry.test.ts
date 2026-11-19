import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getEventLoopLagMs,
  getEventLoopLagStats,
  resetEventLoopLagStats,
  startEventLoopLagSampler,
  stopEventLoopLagSampler,
} from "../src/modules/metrics/event-loop-lag";
import { metricsService } from "../src/modules/metrics/metrics.service";

describe("Event Loop Lag Telemetry & Alerting Thresholds", () => {
  beforeEach(() => {
    stopEventLoopLagSampler();
    resetEventLoopLagStats();
  });

  afterEach(() => {
    stopEventLoopLagSampler();
    resetEventLoopLagStats();
  });

  it("should initialize with default telemetry stats", () => {
    const stats = getEventLoopLagStats();
    expect(stats).toBeDefined();
    expect(stats.currentLagMs).toBeGreaterThanOrEqual(0);
    expect(stats.maxLagMs).toBeGreaterThanOrEqual(0);
    expect(stats.alertThresholdMs).toBe(100);
    expect(stats.totalAlerts).toBe(0);
    expect(stats.isAlerting).toBe(false);
    expect(stats.lastAlertTimestamp).toBeNull();
  });

  it("should start and stop sampler correctly", () => {
    startEventLoopLagSampler(50);
    const lagMs = getEventLoopLagMs();
    expect(lagMs).toBeGreaterThanOrEqual(0);

    stopEventLoopLagSampler();
    const stats = getEventLoopLagStats();
    expect(stats).toBeDefined();
  });

  it("should reset telemetry stats on demand", () => {
    startEventLoopLagSampler(10);
    resetEventLoopLagStats();

    const stats = getEventLoopLagStats();
    expect(stats.currentLagMs).toBe(0);
    expect(stats.maxLagMs).toBe(0);
    expect(stats.totalAlerts).toBe(0);
    expect(stats.isAlerting).toBe(false);
    expect(stats.lastAlertTimestamp).toBeNull();
  });

  it("should expose event loop lag telemetry in metricsService", () => {
    const metrics = metricsService.getMetrics();
    expect(metrics.eventLoopLagTelemetry).toBeDefined();
    expect(metrics.eventLoopLagTelemetry.alertThresholdMs).toBe(100);
    expect(typeof metrics.eventLoopLagTelemetry.currentLagMs).toBe("number");
  });
});
