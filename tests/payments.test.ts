import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("payment endpoints", () => {
  const app = createApp();

  it("creates a stubbed payment quote for valid input", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_123",
      toAddress: "GBLILYDESTINATIONWALLET000000000000000000000000001",
      amount: "25.5000000",
      assetCode: "usdc",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      quoteId: "quote_stub_001",
      fromWalletId: "wallet_123",
      toAddress: "GBLILYDESTINATIONWALLET000000000000000000000000001",
      amount: "25.5000000",
      assetCode: "USDC",
      feeAmount: "0.0000000",
      totalAmount: "25.5000000",
      status: "quoted",
    });
    expect(response.body.data.quote.expiresAt).toEqual(expect.any(String));
  });

  it("rejects invalid payment quote payloads with validation errors", async () => {
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
});
