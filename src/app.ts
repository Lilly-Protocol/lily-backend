import type { IncomingMessage } from "node:http";

import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { cacheControlNoStore } from "./common/http/cache-control.middleware";
import { errorHandler } from "./common/http/error.middleware";
import {
  methodNotAllowedHandler,
  notFoundHandler,
} from "./common/http/not-found.middleware";
import { sanitizeRequestUrl } from "./common/http/request-logger";
import { corsOptions } from "./config/cors";
import { env, securityConfig } from "./config/env";
import { logger } from "./config/logger";
import { apiRateLimiter } from "./config/rate-limit";
import { shouldIgnoreRequestLog } from "./config/request-logging";
import { apiRouter } from "./routes";

const serializeRequestLog = (request: IncomingMessage & { id?: unknown }) => ({
  id: request.id,
  method: request.method,
  url: sanitizeRequestUrl(request.url ?? ""),
  remoteAddress: request.socket?.remoteAddress,
});

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(compression());

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => shouldIgnoreRequestLog(req.url ?? ""),
      },
      serializers: {
        req: serializeRequestLog,
      },
    }),
  );

  app.use(cacheControlNoStore);
  app.use("/api/v1", apiRateLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(methodNotAllowedHandler);
  app.use(errorHandler);

  return app;
};
