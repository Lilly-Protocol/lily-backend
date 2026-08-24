import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

const stellarAddress = (seed: string): string =>
  `G${seed.padEnd(55, "0").slice(0, 55)}`;

const quoteRequest = {
  fromWalletId: "wallet_demo_001",
  toAddress: stellarAddress("DEMODESTINATION"),
  amount: {
    assetCode: "USDC",
    amount: "25.5",
  },
};

describe("payment quote endpoint", () => {
  const app = createApp();

  it("returns a typed quote for a valid payment request", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send(quoteRequest);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      amount: {
        assetCode: "USDC",
        amount: "25.5000000",
      },
      estimatedFee: {
        assetCode: "XLM",
        amount: "0.0000100",
      },
    });
  });

  it("expires the quote in the future so callers can detect staleness", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send(quoteRequest);

    const expiresAt = new Date(response.body.data.quote.expiresAt).getTime();

    expect(Number.isNaN(expiresAt)).toBe(false);
    expect(expiresAt).toBeGreaterThan(Date.now());
  });

  it("accepts the lily-sdk PaymentQuoteRequest shape including an asset issuer", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        ...quoteRequest,
        amount: {
          assetCode: "USDC",
          assetIssuer: stellarAddress("DEMOASSETISSUER"),
          amount: "100",
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.quote.amount).toMatchObject({
      assetCode: "USDC",
      assetIssuer: stellarAddress("DEMOASSETISSUER"),
      amount: "100.0000000",
    });
  });

  it("rejects invalid quote payloads with typed validation errors", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "",
      toAddress: "not-a-stellar-key",
      amount: { assetCode: "", amount: "0" },
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      fromWalletId: [expect.any(String)],
      toAddress: [expect.stringContaining("Stellar public key")],
      amount: expect.arrayContaining([
        expect.stringContaining("Amount must be greater than zero"),
      ]),
    });
  });

  it("rejects amounts beyond Stellar's seven decimal places", async () => {
    const response = await request(app)
      .post("/api/v1/payments/quote")
      .send({
        ...quoteRequest,
        amount: { assetCode: "USDC", amount: "1.123456789" },
      });

    expect(response.status).toBe(400);
    expect(response.body.details.fieldErrors.amount).toEqual(
      expect.arrayContaining([expect.stringContaining("7 decimal places")]),
    );
  });
});
