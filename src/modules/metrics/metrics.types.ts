export interface ProcessMetrics {
  uptimeSeconds: number;
  memoryUsage: {
    rssBytes: number;
    heapTotalBytes: number;
    heapUsedBytes: number;
    externalBytes: number;
  };
  eventLoopLag: {
    minMs: number;
    maxMs: number;
    meanMs: number;
    stddevMs: number;
    p50Ms: number;
    p90Ms: number;
    p99Ms: number;
  };
  nodeVersion: string;
  environment: string;
  timestamp: string;
}
