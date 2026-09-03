import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../src/app";
import { paymentsService } from "../src/modules/payments/payments.service";

const app = createApp();

const settlePayment = async () => {
  const quoteResponse = await request(app).post("/api/v1/payments").send({
    sourceAsset: "USDC",
    destinationAsset: "XLM",
    sourceAmount: "25",
  });

  expect(quoteResponse.status).toBe(201);

  const executeResponse = await request(app)
    .post("/api/v1/payments/execute")
    .send({
      quoteId: quoteResponse.body.data.quote.id,
      confirmed: true,
    });

  expect(executeResponse.status).toBe(200);
  return executeResponse.body.data.payment;
};

describe("GET /api/v1/payments history", () => {
  beforeEach(() => {
    paymentsService.reset();
  });

  it("returns an empty history before any payment is executed", async () => {
    const response = await request(app).get("/api/v1/payments");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        payments: [],
        total: 0,
      },
    });
  });

  it("returns settled payments after execution", async () => {
    const payment = await settlePayment();
    const response = await request(app).get("/api/v1/payments");

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.payments).toEqual([payment]);
  });

  it("returns a defensive copy of the payments array", async () => {
    await settlePayment();

    const snapshot = paymentsService.listPayments();
    snapshot.payments.length = 0;

    const freshSnapshot = paymentsService.listPayments();
    expect(freshSnapshot.total).toBe(1);
    expect(freshSnapshot.payments).toHaveLength(1);
  });
});
