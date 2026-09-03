import { env } from "../../config/env";
import type { ProcessMetrics } from "./metrics.types";

/**
 * Module-level event-loop lag sampler.
 *
 * A single setInterval(1) schedules a setImmediate callback. The callback
 * measures how long it actually took to be invoked. The latest measurement
 * is held in `latestLagMs` and read synchronously by getMetrics.
 *
 * The interval is unref()'d so it does not keep the process alive at
 * shutdown. The interval is the only timer; when the module is unloaded
 * (process exit), it is cleared by Node automatically.
 */
const SAMPLE_INTERVAL_MS = 1_000;
let latestLagMs = 0;

const sampleHandle = setInterval(() => {
  const scheduledAt = process.hrtime.bigint();
  setImmediate(() => {
    const ranAt = process.hrtime.bigint();
    latestLagMs = Number(ranAt - scheduledAt) / 1_000_000;
  });
}, SAMPLE_INTERVAL_MS);
sampleHandle.unref();

function readEventLoopLagMs(): number {
  return latestLagMs;
}

export const metricsService = {
  getMetrics: (): ProcessMetrics => {
    const memory = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsage: {
        rssBytes: memory.rss,
        heapTotalBytes: memory.heapTotal,
        heapUsedBytes: memory.heapUsed,
        externalBytes: memory.external,
      },
      nodeVersion: process.version,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      eventLoopLagMs: readEventLoopLagMs(),
    };
  },
};
