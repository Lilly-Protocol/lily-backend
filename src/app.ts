import compression from "compression";
import cors from "cors";
import { pino } from 'pino';
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { errorHandler } from "./common/http/error.middleware";
import { notFoundHandler } from "./common/http/not-found.middleware";
import { corsOptions } from "./config/cors";
import { env, securityConfig } from "./config/env";
const SENSITIVE_QUERY_KEYS = ['api_key', 'apikey', 'key', 'token', 'secret', 'seed', 'wallet_seed', 'private_key'];

function redactUrl(url: string): string {
  try {
    const u = new URL(url, 'http://localhost');
    let changed = false;
    for (const key of SENSITIVE_QUERY_KEYS) {
      if (u.searchParams.has(key)) {
        u.searchParams.set(key, '[REDACTED]');
        changed = true;
      }
    }
    return changed ? `${u.pathname}${u.search}` : url;
  } catch {
    return url;
  }
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        const serialized = pino.stdSerializers.req(req);
        return {
          ...serialized,
          url: redactUrl(serialized.url || ''),
          headers: undefined,
          body: undefined,
        };
      },
    },
  }),
);
import { apiRateLimiter } from "./config/rate-limit";
import { apiRouter } from "./routes";

export const createApp = () => {
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
  app.use(
    pinoHttp({
      logger,
      customLogLevel(_request, response, error) {
        if (error || response.statusCode >= 500) {
          return "error";
        }

        if (response.statusCode >= 400) {
          return "warn";
        }

        return "info";
      },
    }),
  );
  app.use(apiRateLimiter);

  app.get("/", (_request, response) => {
    response.status(200).json({
      success: true,
      message: `${env.APP_NAME} is running`,
      docs: `${env.API_PREFIX}/health`,
    });
  });

  app.use(env.API_PREFIX, apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
