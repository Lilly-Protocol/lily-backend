import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("payment quote endpoints", () => {
  const app = createApp();

  it("creates a payment quote with valid input", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        fromWalletId: "wallet_123",
        toAddress: "GDESTINATION123",
        amount: "100",
        assetCode: "USDC",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      fromWalletId: "wallet_123",
      toAddress: "GDESTINATION123",
      amount: "100",
      assetCode: "USDC",
      fee: "0",
    });
    expect(response.body.data.quote.quoteId).toMatch(/^quote_/);
    expect(response.body.data.quote.expiresAt).toEqual(expect.any(String));
  });

  it("rejects an invalid payment quote payload", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        fromWalletId: "",
        toAddress: "",
        amount: "",
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
});
