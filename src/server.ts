import { createServer } from "node:http";

import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { securityConfig } from "./config/env";

const app = createApp();
const server = createServer(app);

const usingDefault = (value: string, fallback: string): boolean => value === fallback;

server.listen(env.PORT, () => {
  const defaultOrigins = "http://localhost:3000";
  logger.info(
    {
      appName: env.APP_NAME,
      environment: env.NODE_ENV,
      port: env.PORT,
      apiPrefix: env.API_PREFIX,
      logLevel: env.LOG_LEVEL,
      rateLimitWindowMs: securityConfig.rateLimitWindowMs,
      rateLimitMaxRequests: securityConfig.rateLimitMaxRequests,
      allowedOrigins: securityConfig.allowedOrigins,
      bodySizeLimit: securityConfig.bodySizeLimit,
      trustProxy: securityConfig.trustProxy,
      warnings: [
        ...(usingDefault(env.CORS_ORIGINS, defaultOrigins)
          ? ["CORS_ORIGINS is the default value"]
          : []),
        ...(env.NODE_ENV === "development" ? ["NODE_ENV is development"] : []),
      ],
    },
    "Lily backend server started with resolved configuration",
  );
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, "Graceful shutdown started");

  server.close((error) => {
    if (error) {
      logger.error({ err: error }, "Error while shutting down server");
      process.exit(1);
    }

    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
