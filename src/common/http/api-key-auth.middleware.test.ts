import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { apiKeyAuth } from "./api-key-auth.middleware";

vi.mock("../../config/env", () => ({
  securityConfig: {
    authApiKey: "test-secret-key-12345",
    authApiKeyHeader: "x-api-key",
  },
}));

vi.mock("../../config/logger", () => ({
  logger: { warn: vi.fn() },
}));

describe("apiKeyAuth constant-time comparison", () => {
  const getMock = vi.fn<(name: string) => string | undefined>();
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    getMock.mockReset();
    req = { get: getMock } as unknown as Request;
    res = {} as Response;
    next = vi.fn();
  });

  it("accepts matching key", () => {
    getMock.mockReturnValue("test-secret-key-12345");
    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(next).not.toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("rejects wrong-length key with 403", () => {
    getMock.mockReturnValue("short");
    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("rejects near-miss key with 403", () => {
    getMock.mockReturnValue("test-secret-key-12346");
    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it("rejects missing key with 401", () => {
    getMock.mockReturnValue(undefined);
    apiKeyAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});
