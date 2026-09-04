import type { IncomingMessage } from "node:http";

import { env } from "./env";

export const shouldIgnoreRequestLog = (
  request: IncomingMessage,
  prefix: string = env.API_PREFIX,
): boolean => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const healthPath = `${normalizedPrefix}/health`;
  const metricsPath = `${normalizedPrefix}/metrics`;

  return (
    pathname === "/" ||
    pathname === healthPath ||
    pathname.startsWith(`${healthPath}/`) ||
    pathname === metricsPath ||
    pathname.startsWith(`${metricsPath}/`)
  );
};
