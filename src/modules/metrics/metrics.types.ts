export interface EventLoopLagTelemetry {
  currentLagMs: number;
  maxLagMs: number;
  alertThresholdMs: number;
  sampleIntervalMs: number;
  totalAlerts: number;
  isAlerting: boolean;
  lastAlertTimestamp: string | null;
}

export interface ProcessMetrics {
  uptimeSeconds: number;
  memoryUsage: {
    rssBytes: number;
    heapTotalBytes: number;
    heapUsedBytes: number;
    externalBytes: number;
  };
  eventLoopLagMs: number;
  eventLoopLagTelemetry: EventLoopLagTelemetry;
  nodeVersion: string;
  environment: string;
  timestamp: string;
}
