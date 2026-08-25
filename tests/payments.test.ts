import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";

import { createApp } from "../src/app";
import { paymentsService } from "../src/modules/payments/payments.service";

const app = createApp();

const createTestQuote = async () => {
  const res = await request(app)
    .post("/api/v1/payments")
    .send({
      sourceAsset: "USDC",
      destinationAsset: "ETH",
      sourceAmount: "100",
    });
  return res;
};

describe("Payments API", () => {
  beforeEach(() => {
    paymentsService.reset();
  });

  describe("POST /api/v1/payments", () => {
    it("should create a quote and return 201", async () => {
      const res = await createTestQuote();

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quote).toBeDefined();
      expect(res.body.data.quote.id).toMatch(/^quote_/);
      expect(res.body.data.quote.sourceAsset).toBe("USDC");
      expect(res.body.data.quote.destinationAsset).toBe("ETH");
      expect(res.body.data.quote.sourceAmount).toBe("100");
      expect(res.body.data.quote.destinationAmount).toBeDefined();
      expect(res.body.data.quote.fee).toBeDefined();
      expect(res.body.data.quote.rate).toBeDefined();
      expect(res.body.data.quote.expiresAt).toBeDefined();
      expect(res.body.data.quote.createdAt).toBeDefined();
      expect(res.body.data.quote.status).toBe("active");
    });

    it("should return 400 for invalid body", async () => {
      const res = await request(app)
        .post("/api/v1/payments")
        .send({
          sourceAsset: "",
          destinationAsset: "ETH",
          sourceAmount: "100",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 for missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/payments")
        .send({
          sourceAsset: "USDC",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/v1/payments/quotes/:id", () => {
    it("should return 200 and the quote", async () => {
      const createRes = await createTestQuote();
      const quoteId = createRes.body.data.quote.id;

      const res = await request(app).get(
        `/api/v1/payments/quotes/${quoteId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quote.id).toBe(quoteId);
      expect(res.body.data.quote.sourceAsset).toBe("USDC");
    });

    it("should return 404 for unknown quote id", async () => {
      const res = await request(app).get(
        "/api/v1/payments/quotes/quote_unknown_123",
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 410 for an expired quote", async () => {
      const createRes = await createTestQuote();
      const quoteId = createRes.body.data.quote.id;
      const expiresAt = createRes.body.data.quote.expiresAt;

      const originalNow = Date.now;
      Date.now = () => new Date(expiresAt).getTime() + 60000;

      const res = await request(app).get(
        `/api/v1/payments/quotes/${quoteId}`,
      );

      Date.now = originalNow;

      expect(res.status).toBe(410);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/payments/execute", () => {
    it("should return 200 and a settled payment", async () => {
      const createRes = await createTestQuote();
      const quoteId = createRes.body.data.quote.id;

      const res = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: quoteId,
          confirmed: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment).toBeDefined();
      expect(res.body.data.payment.id).toMatch(/^pay_/);
      expect(res.body.data.payment.quoteId).toBe(quoteId);
      expect(res.body.data.payment.status).toBe("settled");
      expect(res.body.data.payment.sourceAsset).toBe("USDC");
      expect(res.body.data.payment.destinationAsset).toBe("ETH");
    });

    it("should return 404 for unknown quote id", async () => {
      const res = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: "quote_unknown_999",
          confirmed: true,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should return 410 for an expired quote", async () => {
      const createRes = await createTestQuote();
      const quoteId = createRes.body.data.quote.id;
      const expiresAt = createRes.body.data.quote.expiresAt;

      const originalNow = Date.now;
      Date.now = () => new Date(expiresAt).getTime() + 60000;

      const res = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: quoteId,
          confirmed: true,
        });

      Date.now = originalNow;

      expect(res.status).toBe(410);
      expect(res.body.success).toBe(false);
    });

    it("should return 400 when confirmed is false", async () => {
      const createRes = await createTestQuote();
      const quoteId = createRes.body.data.quote.id;

      const res = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: quoteId,
          confirmed: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return 409 on double execution", async () => {
      const createRes = await createTestQuote();
      const quoteId = createRes.body.data.quote.id;

      const firstRes = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: quoteId,
          confirmed: true,
        });

      expect(firstRes.status).toBe(200);

      const secondRes = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: quoteId,
          confirmed: true,
        });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.success).toBe(false);
    });
  });
});
