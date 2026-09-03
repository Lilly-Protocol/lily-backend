import type { NextFunction, Request, Response } from "express";

interface IdempotencyEntry {
  response: unknown;
  statusCode: number;
  createdAt: number;
}

const store = new Map<string, IdempotencyEntry>();
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_MAX_CAPACITY = 1000;
const DEFAULT_SWEEP_INTERVAL_MS = 60 * 1000; // 1 minute

let configuredTtlMs = DEFAULT_TTL_MS;
let configuredMaxCapacity = DEFAULT_MAX_CAPACITY;
let sweepTimer: NodeJS.Timeout | null = null;

export const sweepExpiredEntries = (now = Date.now()): number => {
  let evicted = 0;
  for (const [key, entry] of store.entries()) {
    if (now - entry.createdAt >= configuredTtlMs) {
      store.delete(key);
      evicted++;
    }
  }
  return evicted;
};

const ensureSweepTimer = (): void => {
  if (sweepTimer) {
    return;
  }
  sweepTimer = setInterval(() => {
    sweepExpiredEntries();
  }, DEFAULT_SWEEP_INTERVAL_MS);
  if (typeof sweepTimer.unref === "function") {
    sweepTimer.unref();
  }
};

const evictOldestIfNeeded = (): void => {
  while (store.size > configuredMaxCapacity) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    store.delete(oldestKey);
  }
};

export const configureIdempotencyStore = (options?: {
  ttlMs?: number;
  maxCapacity?: number;
}): void => {
  if (options?.ttlMs !== undefined) {
    configuredTtlMs = options.ttlMs;
  }
  if (options?.maxCapacity !== undefined) {
    configuredMaxCapacity = options.maxCapacity;
  }
  evictOldestIfNeeded();
};

export const getIdempotencyStoreSize = (): number => store.size;

export const idempotencyKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  ensureSweepTimer();

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

  if (existing) {
    if (now - existing.createdAt < configuredTtlMs) {
      res.status(existing.statusCode).json(existing.response);
      return;
    }
    store.delete(key);
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    // Only cache successful 2xx responses (or standard successful operations)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Refresh order for LRU behavior if key existed
      if (store.has(key)) {
        store.delete(key);
      }
      store.set(key, {
        response: body,
        statusCode: res.statusCode,
        createdAt: Date.now(),
      });
      evictOldestIfNeeded();
    }
    return originalJson(body);
  }) as typeof res.json;

  next();
};

// Exposed for testing
export const _resetIdempotencyStore = (): void => {
  store.clear();
  configuredTtlMs = DEFAULT_TTL_MS;
  configuredMaxCapacity = DEFAULT_MAX_CAPACITY;
};

export const clearIdempotencyStore = _resetIdempotencyStore;
