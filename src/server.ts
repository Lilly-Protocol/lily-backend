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

  const forceTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out after 10s, force terminating process");
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  server.close((error) => {
    clearTimeout(forceTimer);
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

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught exception detected, exiting process immediately");
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ err: reason }, "Unhandled promise rejection detected");
});
