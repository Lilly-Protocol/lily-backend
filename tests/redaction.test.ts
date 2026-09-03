import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("pino-http log redaction", () => {
  it("redacts sensitive query keys and omits body/auth headers from logs", async () => {
    const app = createApp();
    const logs: Array<{ req?: Record<string, unknown> }> = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = ((chunk: unknown) => {
      try {
        const line = typeof chunk === "string" ? chunk : String(chunk);
        const parsed = JSON.parse(line.trim()) as {
          req?: Record<string, unknown>;
        };
        if (parsed.req) logs.push(parsed);
      } catch {
        // ignore output that is not a JSON log line
      }
      return true;
    }) as unknown as typeof process.stdout.write;

    await request(app)
      .get("/health?api_key=supersecret&seed=my-wallet-seed&safe=value")
      .set("Authorization", "Bearer leak-me")
      .send({ password: "leak-me" });

    await vi.waitFor(() => {
      expect(logs.length).toBeGreaterThan(0);
    });

    process.stdout.write = originalWrite;

    const reqLog = logs[0]!.req;

    // Body and Authorization must never appear
    expect(reqLog?.body).toBeUndefined();
    expect(reqLog?.headers).toBeUndefined();

    // Sensitive keys redacted, safe param preserved
    expect(reqLog?.url).toContain("api_key=%5BREDACTED%5D");
    expect(reqLog?.url).toContain("seed=%5BREDACTED%5D");
    expect(reqLog?.url).toContain("safe=value");
    expect(reqLog?.url).not.toContain("supersecret");
    expect(reqLog?.url).not.toContain("my-wallet-seed");
  });

  it("omits response headers but keeps statusCode in access logs", async () => {
    const app = createApp();
    const logs: Array<{ res?: Record<string, unknown> }> = [];
    const originalWrite = process.stdout.write;
    process.stdout.write = ((chunk: unknown) => {
      try {
        const line = typeof chunk === "string" ? chunk : String(chunk);
        const parsed = JSON.parse(line.trim()) as {
          res?: Record<string, unknown>;
        };
        if (parsed.res) logs.push(parsed);
      } catch {
        // ignore output that is not a JSON log line
      }
      return true;
    }) as unknown as typeof process.stdout.write;

    await request(app).get("/health");

    await vi.waitFor(() => {
      expect(logs.length).toBeGreaterThan(0);
    });

    process.stdout.write = originalWrite;

    const resLog = logs[0]!.res;

    expect(resLog?.statusCode).toBe(404);
    expect(resLog?.headers).toBeUndefined();
  });
});
