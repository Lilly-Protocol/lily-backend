import { createServer } from "node:http";

import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      environment: env.NODE_ENV,
    },
    "Lily backend server started",
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

const normalizeError = (reason: unknown): Error =>
  reason instanceof Error ? reason : new Error(String(reason));

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error({ err: normalizeError(reason) }, "Unhandled promise rejection");
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error({ err: error }, "Uncaught exception");
  process.exit(1);
});
