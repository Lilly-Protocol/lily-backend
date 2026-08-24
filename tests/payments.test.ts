import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

const stellarAddress = "GC5SALM4WDJVZCNOH7RXEEDJ7T5DPJY4FYIL2K4AAU5WPF4NQJAVLXLY";

const validQuotePayload = {
  fromWalletId: "wallet_123",
  toAddress: stellarAddress,
  amount: {
    assetCode: "USDC",
    amount: "10.00",
  },
};

describe("payment endpoints", () => {
  const app = createApp();

  it("returns a stubbed quote for a valid request", async () => {
    const before = Date.now();
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send(validQuotePayload);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      amount: { assetCode: "USDC", amount: "10.00" },
      estimatedFee: { assetCode: "USDC", amount: "0.01" },
    });
    expect(typeof response.body.data.quote.expiresAt).toBe("string");
    expect(new Date(response.body.data.quote.expiresAt).getTime()).toBeGreaterThan(
      before,
    );
  });

  it("keeps the optional asset issuer when provided", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        ...validQuotePayload,
        amount: {
          ...validQuotePayload.amount,
          assetIssuer: stellarAddress,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.quote.amount.assetIssuer).toBe(stellarAddress);
  });

  it("rejects invalid payloads with typed validation errors", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        fromWalletId: "",
        toAddress: "not-a-stellar-address",
        amount: {
          assetCode: "",
          amount: "-5",
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors.fromWalletId).toEqual([
      expect.any(String),
    ]);
    expect(response.body.details.fieldErrors.toAddress).toEqual([
      expect.any(String),
    ]);
    expect(response.body.details.fieldErrors.amount).toEqual(
      expect.arrayContaining([expect.any(String)]),
    );
    expect(response.body.details.fieldErrors.amount.length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it("rejects requests missing required fields entirely", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.details.fieldErrors).toMatchObject({
      fromWalletId: [expect.any(String)],
      toAddress: [expect.any(String)],
      amount: [expect.any(String)],
    });
  });
});
