import { env } from "../../config/env";
import { logger } from "../../config/logger";
import type { EventLoopLagTelemetry } from "./metrics.types";

let currentLagMs = 0;
let maxLagMs = 0;
let totalAlerts = 0;
let isAlerting = false;
let lastAlertTimestamp: string | null = null;

let timer: NodeJS.Timeout | null = null;
let lastCheckTime: bigint = process.hrtime.bigint();
let currentIntervalMs = env.EVENT_LOOP_LAG_SAMPLE_INTERVAL_MS;

const sampleLag = () => {
  const expectedTime = lastCheckTime + BigInt(currentIntervalMs * 1_000_000);
  const now = process.hrtime.bigint();
  const deltaNs = Number(now - expectedTime);

  // Lag is extra delay beyond scheduled interval, bounded below by 0
  currentLagMs = Math.max(0, Number((deltaNs / 1_000_000).toFixed(3)));
  if (currentLagMs > maxLagMs) {
    maxLagMs = currentLagMs;
  }

  const thresholdMs = env.EVENT_LOOP_LAG_ALERT_THRESHOLD_MS;
  if (currentLagMs > thresholdMs) {
    isAlerting = true;
    totalAlerts += 1;
    lastAlertTimestamp = new Date().toISOString();
    logger.warn(
      {
        currentLagMs,
        thresholdMs,
        totalAlerts,
      },
      `Event loop lag alert: current lag (${currentLagMs}ms) exceeds threshold (${thresholdMs}ms)`,
    );
  } else {
    isAlerting = false;
  }

  lastCheckTime = process.hrtime.bigint();
};

export const startEventLoopLagSampler = (
  intervalMs: number = env.EVENT_LOOP_LAG_SAMPLE_INTERVAL_MS,
): void => {
  if (timer) return;
  currentIntervalMs = intervalMs;
  lastCheckTime = process.hrtime.bigint();
  timer = setInterval(sampleLag, currentIntervalMs);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
};

export const stopEventLoopLagSampler = (): void => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

export const resetEventLoopLagStats = (): void => {
  currentLagMs = 0;
  maxLagMs = 0;
  totalAlerts = 0;
  isAlerting = false;
  lastAlertTimestamp = null;
};

export const getEventLoopLagMs = (): number => {
  if (!timer) {
    startEventLoopLagSampler();
  }
  return currentLagMs;
};

export const getEventLoopLagStats = (): EventLoopLagTelemetry => {
  if (!timer) {
    startEventLoopLagSampler();
  }
  return {
    currentLagMs,
    maxLagMs,
    alertThresholdMs: env.EVENT_LOOP_LAG_ALERT_THRESHOLD_MS,
    sampleIntervalMs: currentIntervalMs,
    totalAlerts,
    isAlerting,
    lastAlertTimestamp,
  };
};
