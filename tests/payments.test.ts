import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("payments quote endpoint", () => {
  const app = createApp();

  it("returns a typed stub quote for a valid payload", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_lily_demo_001",
      toAddress: "GDESTADDRESSEXAMPLEWALLET000000000000000000000001",
      amount: "100.00",
      assetCode: "USDC",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      fromWalletId: "wallet_lily_demo_001",
      toAddress: "GDESTADDRESSEXAMPLEWALLET000000000000000000000001",
      amount: "100.00",
      assetCode: "USDC",
    });
    expect(response.body.data.quote.id).toMatch(/^quote_lily_/);
    expect(response.body.data.quote.estimatedFee).toMatch(/^\d+(\.\d+)?$/);
    expect(new Date(response.body.data.quote.expiresAt).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("rejects invalid quote payloads with typed validation errors", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "",
      toAddress: "",
      amount: "not-a-number",
      assetCode: "",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      fromWalletId: [expect.any(String)],
      toAddress: [expect.any(String)],
      amount: [expect.any(String)],
      assetCode: [expect.any(String)],
    });
  });

  it("rejects requests without a body", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.details.fieldErrors).toMatchObject({
      fromWalletId: [expect.any(String)],
      toAddress: [expect.any(String)],
      amount: [expect.any(String)],
      assetCode: [expect.any(String)],
    });
  });
});
