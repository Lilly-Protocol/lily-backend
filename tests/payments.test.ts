import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("payment endpoints", () => {
  const app = createApp();

  it("returns a stubbed quote for a valid payment request", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_demo_001",
      toAddress: "GDESTINATION",
      amount: "12.50",
      assetCode: "usdc",
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        amount: { amount: "12.50", assetCode: "USDC" },
        estimatedFee: { amount: "0", assetCode: "USDC" },
      },
    });
    expect(response.body.data.expiresAt).toEqual(expect.any(String));
  });

  it("rejects invalid quote payloads with clear validation errors", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "",
      toAddress: "GDESTINATION",
      amount: "not-an-amount",
      assetCode: "USDC!",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      fromWalletId: [expect.any(String)],
      amount: expect.arrayContaining([expect.any(String)]),
      assetCode: [expect.any(String)],
    });
  });
});