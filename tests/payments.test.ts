import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("payments endpoints", () => {
  const app = createApp();

  it("returns a quote for a valid payload", async () => {
    const payload = {
      fromWalletId: "user-123",
      toAddress: "GBJXV33UHQXHLI6U3V42TUS565FTLOHOOUZZ42V67M5QIF747IXX4LHH",
      amount: "100.50",
      assetCode: "USDC",
    };

    const response = await request(app).post("/api/v1/payments/quote").send(payload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      fee: "0",
      amountOut: payload.amount,
    });
    expect(response.body.data.quote.quoteId).toBeDefined();
    expect(response.body.data.quote.expiresAt).toBeDefined();
  });

  it("rejects invalid quote payloads with typed validation errors", async () => {
    const payload = {
      fromWalletId: "",
      toAddress: "invalid-address",
      amount: "abc",
      assetCode: "TOO_LONG_ASSET_CODE_123",
    };

    const response = await request(app).post("/api/v1/payments/quote").send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      fromWalletId: expect.any(Array),
      toAddress: expect.any(Array),
      amount: expect.any(Array),
      assetCode: expect.any(Array),
    });
  });
});
