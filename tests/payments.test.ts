import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { paymentsService } from "../src/modules/payments/payments.service";

describe("payments endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    paymentsService.reset();
  });

  describe("POST /api/v1/payments/quote", () => {
    it("creates a payment quote with valid input", async () => {
      const payload = {
        fromWalletId: "wallet_001",
        toAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAJA5FS2RAPD3G2U7ETC",
        amount: "100.00",
        assetCode: "USDC",
      };

      const response = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quote).toMatchObject({
        id: "quote_1",
        fromWalletId: "wallet_001",
        toAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAJA5FS2RAPD3G2U7ETC",
        amount: "100.00",
        assetCode: "USDC",
        estimatedFee: "0.1000000",
        totalAmount: "100.1000000",
      });
      expect(response.body.data.quote.expiresAt).toBeDefined();
      expect(response.body.data.quote.createdAt).toBeDefined();
      expect(
        new Date(response.body.data.quote.expiresAt).getTime(),
      ).toBeGreaterThan(new Date(response.body.data.quote.createdAt).getTime());
    });

    it("generates sequential quote IDs for successive requests", async () => {
      const payload = {
        fromWalletId: "wallet_001",
        toAddress: "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAJA5FS2RAPD3G2U7ETC",
        amount: "50",
        assetCode: "XLM",
      };

      const firstResponse = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);
      const secondResponse = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);

      expect(firstResponse.status).toBe(201);
      expect(firstResponse.body.data.quote.id).toBe("quote_1");
      expect(secondResponse.status).toBe(201);
      expect(secondResponse.body.data.quote.id).toBe("quote_2");
    });

    it("correctly calculates fee and total amount for fractional amounts", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_002",
        toAddress: "GBLILYSETTLEMENTDEMOWALLET0000000000000000000000000000",
        amount: "100.50",
        assetCode: "USDC",
      });

      expect(response.status).toBe(201);
      expect(response.body.data.quote.estimatedFee).toBe("0.1005000");
      expect(response.body.data.quote.totalAmount).toBe("100.6005000");
    });

    it("rejects empty payload with validation errors for all required fields", async () => {
      const response = await request(app)
        .post("/api/v1/payments/quote")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Request validation failed");
      expect(response.body.details.fieldErrors).toHaveProperty("fromWalletId");
      expect(response.body.details.fieldErrors).toHaveProperty("toAddress");
      expect(response.body.details.fieldErrors).toHaveProperty("amount");
      expect(response.body.details.fieldErrors).toHaveProperty("assetCode");
    });

    it("rejects invalid amount formats", async () => {
      const invalidAmounts = ["invalid", "-50", "abc123", "100.12345678"];

      for (const amount of invalidAmounts) {
        const response = await request(app)
          .post("/api/v1/payments/quote")
          .send({
            fromWalletId: "wallet_001",
            toAddress:
              "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAJA5FS2RAPD3G2U7ETC",
            amount,
            assetCode: "USDC",
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.details.fieldErrors).toHaveProperty("amount");
      }
    });

    it("rejects payloads with fields below minimum length requirements", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "w",
        toAddress: "a",
        amount: "100",
        assetCode: "U",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details.fieldErrors).toHaveProperty("fromWalletId");
      expect(response.body.details.fieldErrors).toHaveProperty("toAddress");
      expect(response.body.details.fieldErrors).toHaveProperty("assetCode");
    });
  });
});
