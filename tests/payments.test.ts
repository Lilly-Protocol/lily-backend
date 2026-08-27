import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("payment endpoints", () => {
  const app = createApp();

  it("creates a stubbed payment quote for valid input", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "wallet_123",
      toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
      amount: "25.5000000",
      assetCode: "usdc",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      quoteId: "quote_stub_001",
      fromWalletId: "wallet_123",
      toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
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
      fromWalletId: expect.arrayContaining([expect.any(String)]),
      toAddress: expect.arrayContaining([expect.any(String)]),
      amount: expect.arrayContaining([expect.any(String)]),
      assetCode: expect.arrayContaining([expect.any(String)]),
    });
  });

  it("rejects invalid assetCode (emoji, space, too long)", async () => {
    const invalidAssetCodes = ["US DC", "USD-😀", "VERYLONGASSETCODE", "USD-C"];
    
    for (const assetCode of invalidAssetCodes) {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_123",
        toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
        amount: "25.5000000",
        assetCode,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Request validation failed");
      expect(response.body.details.fieldErrors).toMatchObject({
        assetCode: expect.arrayContaining([expect.any(String)]),
      });
    }
  });
});
