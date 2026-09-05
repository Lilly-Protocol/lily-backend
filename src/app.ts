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
import { corsOptions } from "./config/cors";
import { env, securityConfig } from "./config/env";
import { logger } from "./config/logger";
import { apiRateLimiter } from "./config/rate-limit";
import { shouldIgnoreRequestLog } from "./config/request-logging";
import { apiRouter } from "./routes";

const sensitiveQueryKeys = [
  "api_key",
  "apikey",
  "key",
  "token",
  "secret",
  "seed",
  "wallet_seed",
  "private_key",
];

const redactUrl = (url: string): string => {
  try {
    const parsed = new URL(url, "http://localhost");
    let changed = false;
    for (const key of sensitiveQueryKeys) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, "[REDACTED]");
        changed = true;
      }
    }
    return changed ? `${parsed.pathname}${parsed.search}` : url;
  } catch {
    return url;
  }
};

const serializeRequestLog = (request: IncomingMessage & { id?: unknown }) => ({
  id: request.id,
  method: request.method,
  url: redactUrl(request.url ?? ""),
  remoteAddress: request.socket?.remoteAddress,
  remotePort: request.socket?.remotePort,
});

export const createApp = (): express.Express => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", securityConfig.trustProxy);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: securityConfig.bodySizeLimit }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cacheControlNoStore);
import { randomUUID } from "node:crypto";

 app.use(
   pinoHttp({
     logger,
     autoLogging: { ignore: shouldIgnoreRequestLog },
     genReqId: (req) => req.headers['x-request-id'] || randomUUID(),
     customLogLevel(_request, response, error) {
       if (error || response.statusCode >= 500) {
         return "error";
        }

        if (response.statusCode >= 400) {
          return "warn";
        }

        return "info";
      },
      serializers: {
        req: serializeRequestLog as never,
      },
    }),
 );

 // Middleware to set X-Request-Id on every response
 app.use((req, res, next) => {
   const requestId = req.id; // pino-http attaches this via genReqId
   res.setHeader('X-Request-Id', requestId);
   next();
 });

 app.get("/", (_request, response) => {
    response.status(200).json({
      success: true,
      message: `${env.APP_NAME} is running`,
      docs: `${env.API_PREFIX}/health`,
    });
  });

  app.use(env.API_PREFIX, apiRateLimiter);
  app.use(env.API_PREFIX, apiRouter);
  app.use(methodNotAllowedHandler(apiRouter));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
