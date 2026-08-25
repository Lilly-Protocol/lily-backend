import type { NextFunction, Request, Response } from "express";

interface CachedResponse {
  status: number;
  body: unknown;
  expiresAt: number;
}

const store = new Map<string, CachedResponse>();

const TTL_MS = 24 * 60 * 60 * 1000;

export const clearIdempotencyStore = (): void => {
  store.clear();
};

export const idempotencyMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const key = request.headers["idempotency-key"] as string | undefined;

  if (!key) {
    next();
    return;
  }

  const now = Date.now();
  const cached = store.get(key);

  if (cached && cached.expiresAt > now) {
    response.status(cached.status).json(cached.body);
    return;
  }

  if (cached && cached.expiresAt <= now) {
    store.delete(key);
  }

  const originalJson = response.json.bind(response);

  response.json = (body: unknown): Response => {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      store.set(key, {
        status: response.statusCode,
        body,
        expiresAt: now + TTL_MS,
      });
    }

    return originalJson(body);
  };

  next();
};
