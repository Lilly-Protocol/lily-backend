import type { NextFunction, Request, Response } from "express";

interface IdempotencyEntry {
  response: unknown;
  statusCode: number;
  createdAt: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_MAX_ENTRIES = 1000;

const store = new Map<string, IdempotencyEntry>();
let ttlMs = DEFAULT_TTL_MS;
let maxEntries = DEFAULT_MAX_ENTRIES;

const evictExpired = (): void => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.createdAt > ttlMs) {
      store.delete(key);
    }
  }
};

const evictOldestIfNeeded = (): void => {
  if (store.size <= maxEntries) {
    return;
  }

  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, entry] of store.entries()) {
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    store.delete(oldestKey);
  }
};

// Sweep expired entries periodically. `unref()` keeps the interval from
// preventing the Node process from exiting naturally.
const SWEEP_INTERVAL_MS = Math.min(ttlMs / 2, 60 * 60 * 1000);
const sweepInterval = setInterval(evictExpired, SWEEP_INTERVAL_MS);
sweepInterval.unref();

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

  if (existing && now - existing.createdAt < ttlMs) {
    res.status(existing.statusCode).json(existing.response);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    store.set(key, {
      response: body,
      statusCode: res.statusCode,
      createdAt: Date.now(),
    });
    evictOldestIfNeeded();
    return originalJson(body);
  }) as typeof res.json;

  next();
};

// Exposed for testing
export const _resetIdempotencyStore = (): void => {
  store.clear();
};

export const clearIdempotencyStore = _resetIdempotencyStore;

export const _configureIdempotencyStore = (options: {
  ttlMs?: number;
  maxEntries?: number;
}): void => {
  if (options.ttlMs !== undefined) {
    ttlMs = options.ttlMs;
  }
  if (options.maxEntries !== undefined) {
    maxEntries = options.maxEntries;
  }
};
