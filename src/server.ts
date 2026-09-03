import { createServer } from "node:http";

import { createApp } from "./app";
import { buildInfo } from "./config/build-info";
import { env } from "./config/env";
import { logger } from "./config/logger";

const app = createApp();
const server = createServer(app);

server.on("error", (error) => {
  if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
    logger.fatal(
      { code: "EADDRINUSE", host: env.HOST, port: env.PORT },
      `Port ${env.PORT} is already in use on ${env.HOST}`,
    );
  } else {
    logger.fatal(
      {
        err: error,
        code: (error as NodeJS.ErrnoException).code,
        host: env.HOST,
        port: env.PORT,
      },
      "Failed to start HTTP server",
    );
  }
  process.exit(1);
});

server.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      appName: env.APP_NAME,
      environment: env.NODE_ENV,
      host: env.HOST,
      port: env.PORT,
      ...buildInfo,
    },
    "Lily backend server started with resolved configuration",
  );
});

let isShuttingDown = false;

const shutdown = (signal: string) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info({ signal }, "Graceful shutdown started");

  // Force close after 10s if connections fail to drain
  const forceTimeout = setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing process exit");
    process.exit(1);
  }, 10_000);
  forceTimeout.unref();

  // Close idle connections to speed up draining
  if (typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }

  server.close((error) => {
    clearTimeout(forceTimeout);
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

process.on("unhandledRejection", (reason: unknown) => {
  logger.fatal({ err: reason }, "Unhandled Promise Rejection detected");
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (error: Error) => {
  logger.fatal({ err: error }, "Uncaught Exception detected");
  shutdown("uncaughtException");
});
