import type { NextFunction, Request, Response } from "express";

interface IdempotencyEntry {
  response: unknown;
  statusCode: number;
  createdAt: number;
}

const store = new Map<string, IdempotencyEntry>();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const idempotencyKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.method !== "POST") {
    next();
    return;
  }

  const key = req.headers["idempotency-key"];
  if (!key || typeof key !== "string" || key.length === 0) {
    next();
    return;
  }

  const now = Date.now();
  const existing = store.get(key);

  if (existing && now - existing.createdAt < TTL_MS) {
    res.status(existing.statusCode).json(existing.response);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    // Only cache successful responses. Failed requests (validation errors,
    // unhandled exceptions, etc.) should not poison the store for retries.
    if (res.statusCode >= 200 && res.statusCode < 300) {
      store.set(key, {
        response: body,
        statusCode: res.statusCode,
        createdAt: Date.now(),
      });
    }
    return originalJson(body);
  }) as typeof res.json;

  next();
};

// Exposed for testing
export const _resetIdempotencyStore = (): void => {
  store.clear();
};

export const clearIdempotencyStore = _resetIdempotencyStore;
