import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { paymentsService } from "../src/modules/payments/payments.service";

describe("payments endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    paymentsService.reset();
  });

  it("returns a stub quote for a valid payload", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_treasury_001",
      toAddress: "GBLILYDEMOSETTLEMENTWALLET000000000000000000001",
      amount: 125.5,
      assetCode: "USDC",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      quoteId: expect.stringMatching(/^quote_\d+_1$/),
      fromWalletId: "wallet_treasury_001",
      toAddress: "GBLILYDEMOSETTLEMENTWALLET000000000000000000001",
      assetCode: "USDC",
      amount: 125.5,
    });
    expect(response.body.data.quote.feeAmount).toBeGreaterThan(0);
    expect(response.body.data.quote.totalAmount).toBeGreaterThan(
      response.body.data.quote.amount,
    );
    expect(
      new Date(response.body.data.quote.expiresAt).getTime(),
    ).toBeGreaterThan(new Date(response.body.data.quote.createdAt).getTime());
  });

  it("rejects invalid quote payloads with typed validation errors", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "",
      toAddress: "",
      amount: -5,
      assetCode: "usdc!",
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
