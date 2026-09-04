import { env } from "../../config/env";
import { monitorEventLoopDelay } from "node:perf_hooks";
import type { ProcessMetrics } from "./metrics.types";

const eldHistogram = monitorEventLoopDelay({ resolution: 10 });
eldHistogram.enable();

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
      eventLoopLag: {
        minMs: eldHistogram.min / 1e6,
        maxMs: eldHistogram.max / 1e6,
        meanMs: eldHistogram.mean / 1e6,
        stddevMs: eldHistogram.stddev / 1e6,
        p50Ms: eldHistogram.percentile(50) / 1e6,
        p90Ms: eldHistogram.percentile(90) / 1e6,
        p99Ms: eldHistogram.percentile(99) / 1e6,
      },
      nodeVersion: process.version,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };
  },
};
