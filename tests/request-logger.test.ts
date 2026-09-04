import type { SerializedRequest } from "pino-std-serializers";
import { describe, expect, it } from "vitest";

import {
  sanitizeRequestUrl,
  serializeRequest,
} from "../src/common/http/request-logger";

describe("request log sanitization", () => {
  it("redacts sensitive query values while preserving safe query context", () => {
    expect(
      sanitizeRequestUrl(
        "/api/v1/agents?owner=alice&api-key=secret-value&limit=10&token=abc",
      ),
    ).toBe(
      "/api/v1/agents?owner=alice&api-key=%5BREDACTED%5D&limit=10&token=%5BREDACTED%5D",
    );
  });

  it("redacts case-variant and hyphenated query keys", () => {
    expect(
      sanitizeRequestUrl(
        "/api/v1/agents?API_KEY=leak1&Api-Key=leak2&ACCESS-TOKEN=leak3&sig=leak4&sort=asc",
      ),
    ).toBe(
      "/api/v1/agents?API_KEY=%5BREDACTED%5D&Api-Key=%5BREDACTED%5D&ACCESS-TOKEN=%5BREDACTED%5D&sig=%5BREDACTED%5D&sort=asc",
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
      url: "/api/v1/agents?authorization=%5BREDACTED%5D",
      remoteAddress: "127.0.0.1",
      remotePort: 4000,
    });
    expect(serializeRequest(request)).not.toHaveProperty("headers");
    expect(serializeRequest(request)).not.toHaveProperty("query");
    expect(serializeRequest(request)).not.toHaveProperty("raw");
  });
});
