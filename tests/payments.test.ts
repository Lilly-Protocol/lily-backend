import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

const validStellarAddress =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZRYH";

describe("payments endpoints", () => {
  const app = createApp();

  it("creates a payment quote with valid input", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        fromWalletId: "wallet_lily_001",
        toAddress: validStellarAddress,
        amount: "100.50",
        assetCode: "USDC",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      fromWalletId: "wallet_lily_001",
      toAddress: validStellarAddress,
      amount: "100.50",
      assetCode: "USDC",
      estimatedFee: expect.any(String),
      totalCost: expect.any(String),
    });
    expect(response.body.data.quoteId).toMatch(/^quote_/);
    expect(response.body.data.expiresAt).toBeDefined();
  });

  it("rejects invalid payloads with typed validation errors", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        fromWalletId: "",
        toAddress: "not-a-valid-address",
        amount: "abc",
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

  it("rejects missing required fields", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
  });
});
