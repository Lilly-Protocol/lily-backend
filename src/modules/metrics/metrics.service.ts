import { env } from "../../config/env";
import type { ProcessMetrics, StatusCodeMetrics } from "./metrics.types";

interface RequestMetricsState {
  requestCount: number;
  totalDurationMs: number;
  statusCodes: StatusCodeMetrics;
  methods: Record<string, number>;
}

const createInitialState = (): RequestMetricsState => ({
  requestCount: 0,
  totalDurationMs: 0,
  statusCodes: {
    "1xx": 0,
    "2xx": 0,
    "3xx": 0,
    "4xx": 0,
    "5xx": 0,
  },
  methods: {},
});

let requestMetrics: RequestMetricsState = createInitialState();

export const metricsService = {
  recordRequest: (
    method: string,
    statusCode: number,
    durationMs: number,
  ): void => {
    requestMetrics.requestCount += 1;

    const roundedDuration = Math.round(durationMs * 100) / 100;
    requestMetrics.totalDurationMs =
      Math.round((requestMetrics.totalDurationMs + roundedDuration) * 100) /
      100;

    if (statusCode >= 100 && statusCode < 200) {
      requestMetrics.statusCodes["1xx"] += 1;
    } else if (statusCode >= 200 && statusCode < 300) {
      requestMetrics.statusCodes["2xx"] += 1;
    } else if (statusCode >= 300 && statusCode < 400) {
      requestMetrics.statusCodes["3xx"] += 1;
    } else if (statusCode >= 400 && statusCode < 500) {
      requestMetrics.statusCodes["4xx"] += 1;
    } else if (statusCode >= 500 && statusCode < 600) {
      requestMetrics.statusCodes["5xx"] += 1;
    }

    const normalizedMethod = (method || "UNKNOWN").toUpperCase();
    requestMetrics.methods[normalizedMethod] =
      (requestMetrics.methods[normalizedMethod] ?? 0) + 1;
  },

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
      requestCount: requestMetrics.requestCount,
      totalDurationMs: requestMetrics.totalDurationMs,
      statusCodes: { ...requestMetrics.statusCodes },
      methods: { ...requestMetrics.methods },
    };
  },

  resetMetrics: (): void => {
    requestMetrics = createInitialState();
  },
};
