import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("payments endpoints", () => {
  const app = createApp();

  const validAddress =
    "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";

  it("creates a payment quote for a valid payload", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_user_123",
      toAddress: validAddress,
      amount: "50.0000000",
      assetCode: "USDC",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      fromWalletId: "wallet_user_123",
      toAddress: validAddress,
      amount: "50.0000000",
      assetCode: "USDC",
      feeAmount: "0.0000000",
      totalAmount: "50.0000000",
      status: "quoted",
    });
    expect(response.body.data.quote.quoteId).toBeDefined();
    expect(response.body.data.quote.expiresAt).toBeDefined();
  });

  it("rejects non-56-char toAddress with 400 validation error", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_user_123",
      toAddress: "foo",
      amount: "50.0000000",
      assetCode: "USDC",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors.toAddress).toBeDefined();
  });

  it("rejects invalid checksum toAddress with 400 validation error", async () => {
    const corruptedChecksum =
      "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHB";

    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_user_123",
      toAddress: corruptedChecksum,
      amount: "50.0000000",
      assetCode: "USDC",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors.toAddress).toBeDefined();
  });

  it("rejects wrong-prefix toAddress with 400 validation error", async () => {
    const wrongPrefix =
      "AAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";

    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_user_123",
      toAddress: wrongPrefix,
      amount: "50.0000000",
      assetCode: "USDC",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors.toAddress).toBeDefined();
  });
});
