import type { IncomingMessage } from "node:http";

import { env } from "./env";

export const shouldIgnoreRequestLog = (request: IncomingMessage): boolean => {
  const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
  const healthPath = `${env.API_PREFIX}/health`;
  const metricsPath = `${env.API_PREFIX}/metrics`;

  return (
    pathname === "/" ||
    pathname === healthPath ||
    pathname.startsWith(`${healthPath}/`) ||
    pathname === metricsPath ||
    pathname.startsWith(`${metricsPath}/`)
  );
};
