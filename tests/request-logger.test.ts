import type { SerializedRequest } from "pino-std-serializers";
import { describe, expect, it } from "vitest";

import { sanitizeRequestUrl, serializeRequest } from "../src/common/http/request-logger";

describe("request log sanitization", () => {
  it("redacts sensitive query values while preserving safe query context", () => {
    expect(
      sanitizeRequestUrl(
        "/api/v1/agents?owner=alice&api-key=secret-value&limit=10&token=abc",
      ),
    ).toBe(
      "/api/v1/agents?owner=alice&api-key=%5BRedacted%5D&limit=10&token=%5BRedacted%5D",
    );
  });

  it("omits headers, query objects, params, and raw request data", () => {
    const request = {
      id: "request-1",
      method: "GET",
      url: "/api/v1/agents?authorization=bearer-secret",
      headers: { authorization: "Bearer secret-value" },
      remoteAddress: "127.0.0.1",
      remotePort: 4000,
      params: {},
      query: { authorization: "bearer-secret" },
      raw: {},
    } as unknown as SerializedRequest;

    expect(serializeRequest(request)).toEqual({
      id: "request-1",
      method: "GET",
      url: "/api/v1/agents?authorization=%5BRedacted%5D",
      remoteAddress: "127.0.0.1",
      remotePort: 4000,
    });
    expect(serializeRequest(request)).not.toHaveProperty("headers");
    expect(serializeRequest(request)).not.toHaveProperty("query");
    expect(serializeRequest(request)).not.toHaveProperty("raw");
  });

  it("redacts client_secret and sensitive keys in requests", () => {
    expect(
      sanitizeRequestUrl("/api/v1/agents?client_secret=topsecret&safe_param=hello"),
    ).toBe("/api/v1/agents?client_secret=%5BRedacted%5D&safe_param=hello");
  });

  it("normalizes case and dash variants for redaction", () => {
    expect(
      sanitizeRequestUrl(
        "/api/v1/agents?API-KEY=secret&client-secret=confidential&wallet_seed=phrase",
      ),
    ).toBe(
      "/api/v1/agents?API-KEY=%5BRedacted%5D&client-secret=%5BRedacted%5D&wallet_seed=%5BRedacted%5D",
    );
  });

  it("falls back to socket remoteAddress and remotePort when top-level properties are missing", () => {
    const request = {
      id: "request-socket-1",
      method: "POST",
      url: "/api/v1/payments",
      socket: {
        remoteAddress: "10.0.0.1",
        remotePort: 8080,
      },
    } as unknown as SerializedRequest;

    expect(serializeRequest(request)).toEqual({
      id: "request-socket-1",
      method: "POST",
      url: "/api/v1/payments",
      remoteAddress: "10.0.0.1",
      remotePort: 8080,
    });
  });

  it("handles empty or undefined url gracefully", () => {
    expect(sanitizeRequestUrl("")).toBe("");
    expect(sanitizeRequestUrl()).toBe("");

    const request = {
      id: "req-empty",
      method: "GET",
    } as unknown as SerializedRequest;

    expect(serializeRequest(request)).toEqual({
      id: "req-empty",
      method: "GET",
      url: "",
      remoteAddress: undefined,
      remotePort: undefined,
    });
  });
});
