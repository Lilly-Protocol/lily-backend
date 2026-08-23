import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { paymentsService } from "../src/modules/payments/payments.service";

describe("payments endpoints", () => {
  const app = createApp();

  beforeEach(() => {
    paymentsService.reset();
  });

  describe("AC1: POST /api/v1/payments/quote happy path", () => {
    it("creates a quote with valid input and returns 201", async () => {
      const payload = {
        fromWalletId: "wallet_sender_001",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "100.5",
        assetCode: "USDC",
      };

      const response = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quote).toMatchObject({
        fromWalletId: payload.fromWalletId,
        toAddress: payload.toAddress,
        amount: payload.amount,
        assetCode: payload.assetCode,
      });
      expect(response.body.data.quote.id).toBeDefined();
      expect(response.body.data.quote.estimatedFee).toBeDefined();
      expect(response.body.data.quote.totalAmount).toBeDefined();
      expect(response.body.data.quote.expiresAt).toBeDefined();
      expect(response.body.data.quote.createdAt).toBeDefined();
    });

    it("calculates correct estimated fee and total amount", async () => {
      const payload = {
        fromWalletId: "wallet_sender_002",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "1000",
        assetCode: "USDC",
      };

      const response = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);

      expect(response.status).toBe(201);
      const quote = response.body.data.quote;
      expect(quote.estimatedFee).toBe("1"); // 0.1% of 1000
      expect(quote.totalAmount).toBe("1001");
    });

    it("generates unique quote IDs for each request", async () => {
      const payload = {
        fromWalletId: "wallet_sender_003",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "50",
        assetCode: "USDC",
      };

      const response1 = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);
      const response2 = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(response1.body.data.quote.id).not.toBe(
        response2.body.data.quote.id
      );
    });

    it("sets quote expiration to 5 minutes from creation", async () => {
      const payload = {
        fromWalletId: "wallet_sender_004",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "75",
        assetCode: "USDC",
      };

      const beforeRequest = Date.now();
      const response = await request(app)
        .post("/api/v1/payments/quote")
        .send(payload);
      const afterRequest = Date.now();

      expect(response.status).toBe(201);
      const expiresAt = new Date(response.body.data.quote.expiresAt).getTime();
      const expectedExpiration = beforeRequest + 5 * 60 * 1000;

      // Allow 1 second tolerance for test execution time
      expect(expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000);
    });
  });

  describe("AC2: Quote validation failure cases", () => {
    it("rejects quote with missing fromWalletId", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "100",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details.fieldErrors.fromWalletId).toBeDefined();
    });

    it("rejects quote with missing toAddress", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_005",
        amount: "100",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.toAddress).toBeDefined();
    });

    it("rejects quote with missing amount", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_006",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.amount).toBeDefined();
    });

    it("rejects quote with missing assetCode", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_007",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "100",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.assetCode).toBeDefined();
    });

    it("rejects quote with fromWalletId too short (< 2 chars)", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "w",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "100",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.fromWalletId).toBeDefined();
    });

    it("rejects quote with fromWalletId too long (> 80 chars)", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "w".repeat(81),
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "100",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.fromWalletId).toBeDefined();
    });

    it("rejects quote with toAddress too short (< 2 chars)", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_008",
        toAddress: "G",
        amount: "100",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.toAddress).toBeDefined();
    });

    it("rejects quote with toAddress too long (> 80 chars)", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_009",
        toAddress: "G".repeat(81),
        amount: "100",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.toAddress).toBeDefined();
    });

    it("rejects quote with invalid amount format", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_010",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "not-a-number",
        assetCode: "USDC",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.amount).toBeDefined();
    });

    it("rejects quote with assetCode too short (< 2 chars)", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_011",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "100",
        assetCode: "U",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.assetCode).toBeDefined();
    });

    it("rejects quote with assetCode too long (> 20 chars)", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "wallet_sender_012",
        toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
        amount: "100",
        assetCode: "U".repeat(21),
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors.assetCode).toBeDefined();
    });

    it("provides clear, typed validation error structure", async () => {
      const response = await request(app).post("/api/v1/payments/quote").send({
        fromWalletId: "w",
        toAddress: "G",
        amount: "invalid",
        assetCode: "U",
      });

      expect(response.status).toBe(400);
      expect(response.body.details.fieldErrors).toHaveProperty("fromWalletId");
      expect(response.body.details.fieldErrors).toHaveProperty("toAddress");
      expect(response.body.details.fieldErrors).toHaveProperty("amount");
      expect(response.body.details.fieldErrors).toHaveProperty("assetCode");
      expect(Array.isArray(response.body.details.fieldErrors.fromWalletId)).toBe(
        true
      );
      expect(
        response.body.details.fieldErrors.fromWalletId[0]
      ).toBeDefined();
    });
  });

  describe("AC3: Tests pass in CI", () => {
    it("quote endpoint passes happy path and validation tests", async () => {
      // Happy path
      const validResponse = await request(app)
        .post("/api/v1/payments/quote")
        .send({
          fromWalletId: "wallet_sender_final",
          toAddress: "GBJCHUKJQJ3QKDQOHXY4YE6YSGNMVPJ2TBTNHZR3GQBH55QPCSXNLF5N",
          amount: "250.75",
          assetCode: "USDC",
        });

      expect(validResponse.status).toBe(201);
      expect(validResponse.body.success).toBe(true);

      // Validation failure
      const invalidResponse = await request(app)
        .post("/api/v1/payments/quote")
        .send({
          fromWalletId: "w",
          toAddress: "G",
          amount: "invalid",
          assetCode: "U",
        });

      expect(invalidResponse.status).toBe(400);
      expect(invalidResponse.body.success).toBe(false);
    });
  });
});
