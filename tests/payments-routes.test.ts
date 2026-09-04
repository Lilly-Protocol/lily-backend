import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { paymentsService } from "../src/modules/payments/payments.service";

describe("Payment quote lifecycle integration tests (issue #256)", () => {
  const app = createApp();

  beforeEach(() => {
    paymentsService.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("POST /api/v1/payments creates an active quote with correct envelope", async () => {
    const payload = {
      sourceAsset: "USDC",
      destinationAsset: "XLM",
      sourceAmount: "100.00",
    };

    const res = await request(app)
      .post("/api/v1/payments")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.quote).toMatchObject({
      sourceAsset: "USDC",
      destinationAsset: "XLM",
      sourceAmount: "100.00",
      status: "active",
      rate: "1.0002",
    });
    expect(typeof res.body.data.quote.id).toBe("string");
    expect(typeof res.body.data.quote.destinationAmount).toBe("string");
    expect(typeof res.body.data.quote.fee).toBe("string");
    expect(typeof res.body.data.quote.expiresAt).toBe("string");
  });

  it("GET /api/v1/payments/quotes/:id handles live, missing, and expired quotes", async () => {
    // Create a live quote
    const createRes = await request(app)
      .post("/api/v1/payments")
      .send({
        sourceAsset: "USDC",
        destinationAsset: "XLM",
        sourceAmount: "50.00",
      });

    expect(createRes.status).toBe(201);
    const quoteId = createRes.body.data.quote.id;

    // Live lookup
    const getRes = await request(app).get(`/api/v1/payments/quotes/${quoteId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.quote.id).toBe(quoteId);
    expect(getRes.body.data.quote.status).toBe("active");

    // Missing lookup
    const notFoundRes = await request(app).get("/api/v1/payments/quotes/quote_nonexistent_123");
    expect(notFoundRes.status).toBe(404);
    expect(notFoundRes.body.success).toBe(false);
    expect(notFoundRes.body.message).toBe("Quote not found");

    // Expired lookup (past 5 minutes TTL)
    const realNow = Date.now();
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(realNow + 6 * 60 * 1000);

    const expiredRes = await request(app).get(`/api/v1/payments/quotes/${quoteId}`);
    expect(expiredRes.status).toBe(410);
    expect(expiredRes.body.success).toBe(false);
    expect(expiredRes.body.message).toBe("Quote has expired");

    dateSpy.mockRestore();
  });

  it("POST /api/v1/payments/execute handles validation, missing/expired quotes, double execution, and successful settlement", async () => {
    const createRes = await request(app)
      .post("/api/v1/payments")
      .send({
        sourceAsset: "USDC",
        destinationAsset: "XLM",
        sourceAmount: "200.00",
      });
    const quoteId = createRes.body.data.quote.id;

    // Missing quote
    const missingRes = await request(app)
      .post("/api/v1/payments/execute")
      .send({ quoteId: "quote_missing_999", confirmed: true });
    expect(missingRes.status).toBe(404);
    expect(missingRes.body.success).toBe(false);

    // Unconfirmed payment (confirmed = false)
    const unconfirmedRes = await request(app)
      .post("/api/v1/payments/execute")
      .send({ quoteId, confirmed: false });
    expect(unconfirmedRes.status).toBe(400);
    expect(unconfirmedRes.body.success).toBe(false);
    expect(unconfirmedRes.body.message).toBe("Payment must be confirmed");

    // Successful execution
    const execRes = await request(app)
      .post("/api/v1/payments/execute")
      .send({ quoteId, confirmed: true });
    expect(execRes.status).toBe(200);
    expect(execRes.body.success).toBe(true);
    expect(execRes.body.data.payment).toMatchObject({
      quoteId,
      sourceAsset: "USDC",
      destinationAsset: "XLM",
      sourceAmount: "200.00",
      status: "settled",
    });
    expect(typeof execRes.body.data.payment.id).toBe("string");
    expect(typeof execRes.body.data.payment.createdAt).toBe("string");

    // Double execution (conflict 409)
    const doubleRes = await request(app)
      .post("/api/v1/payments/execute")
      .send({ quoteId, confirmed: true });
    expect(doubleRes.status).toBe(409);
    expect(doubleRes.body.success).toBe(false);
    expect(doubleRes.body.message).toBe("Quote has already been executed");

    // Expired quote execution
    const createRes2 = await request(app)
      .post("/api/v1/payments")
      .send({
        sourceAsset: "USDC",
        destinationAsset: "XLM",
        sourceAmount: "10.00",
      });
    const quoteId2 = createRes2.body.data.quote.id;

    const realNow = Date.now();
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(realNow + 6 * 60 * 1000);

    const expiredExecRes = await request(app)
      .post("/api/v1/payments/execute")
      .send({ quoteId: quoteId2, confirmed: true });
    expect(expiredExecRes.status).toBe(410);
    expect(expiredExecRes.body.success).toBe(false);
    expect(expiredExecRes.body.message).toBe("Quote has expired");

    dateSpy.mockRestore();
  });
});
