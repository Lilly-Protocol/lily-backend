import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";

describe("payment endpoints", () => {
  const app = createApp();

  it("returns a typed quote for a valid payment payload", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "agentlily_demo_001",
      toAddress: `G${"LILYDEMO".padEnd(55, "0")}`,
      amount: "25.5000000",
      assetCode: "USDC",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quote).toMatchObject({
      fromWalletId: "agentlily_demo_001",
      toAddress: `G${"LILYDEMO".padEnd(55, "0")}`,
      amount: "25.5000000",
      assetCode: "USDC",
      feeAmount: "0",
      totalAmount: "25.5000000",
      status: "pending",
    });
    expect(response.body.data.quote.id).toMatch(/^quote_/);
    expect(Number.isNaN(Date.parse(response.body.data.quote.expiresAt))).toBe(
      false,
    );
  });

  it("rejects invalid payloads with typed validation errors", async () => {
    const response = await request(app).post("/api/v1/payments/quote").send({
      fromWalletId: "",
      toAddress: "not-a-stellar-address",
      amount: "0",
      assetCode: "",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Request validation failed");
    expect(response.body.details.fieldErrors).toMatchObject({
      fromWalletId: [expect.any(String)],
      toAddress: [expect.any(String)],
      amount: [expect.any(String)],
      assetCode: [expect.any(String)],
    });
  });
});
