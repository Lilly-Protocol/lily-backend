export interface StatusCodeMetrics {
  "1xx": number;
  "2xx": number;
  "3xx": number;
  "4xx": number;
  "5xx": number;
}

export interface HttpRequestMetrics {
  requestCount: number;
  totalDurationMs: number;
  statusCodes: StatusCodeMetrics;
  methods: Record<string, number>;
}

export interface ProcessMetrics extends HttpRequestMetrics {
  uptimeSeconds: number;
  memoryUsage: {
    rssBytes: number;
    heapTotalBytes: number;
    heapUsedBytes: number;
    externalBytes: number;
  };
  nodeVersion: string;
  environment: string;
  timestamp: string;
}
