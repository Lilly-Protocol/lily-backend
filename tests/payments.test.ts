import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("payment endpoints", () => {
  const app = createApp();

  it("returns a stubbed quote response for a valid payload", async () => {
    const payload = {
      fromWalletId: "G1234567890",
      toAddress: "G0987654321",
      amount: "100.00",
      assetCode: "USDC"
    };

    const response = await request(app).post("/api/v1/payments/quote").send(payload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      quoteId: expect.stringMatching(/^quote_\d+$/),
      estimatedFee: "1.00",
      exchangeRate: "1.00",
      totalAmount: "101.00"
    });
  });

  it("returns validation error for missing required fields", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({});

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

  it("returns validation error for invalid amount format", async () => {
    const payload = {
      fromWalletId: "G1234567890",
      toAddress: "G0987654321",
      amount: "invalid_amount",
      assetCode: "USDC"
    };

    const response = await request(app).post("/api/v1/payments/quote").send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      amount: [expect.any(String)],
    });
  });
});
