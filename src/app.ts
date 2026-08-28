import compression from "compression";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { errorHandler } from "@/common/http/error.middleware";
import { notFoundHandler } from "@/common/http/not-found.middleware";
import { corsMiddleware } from "@/config/cors";
import { env } from "@/config/env";
import { logger } from "@/config/logger";
import { apiRateLimiter } from "@/config/rate-limit";
import { apiRouter } from "@/routes";

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(compression());
  app.use(express.json());
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== "test",
    }),
  );

  app.get("/", (_request, response) => {
    response.status(200).json({
      success: true,
      message: `${env.APP_NAME} is active`,
      docs: `${env.API_PREFIX}/health`,
    });
  });

  app.use(env.API_PREFIX, apiRateLimiter);
  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
