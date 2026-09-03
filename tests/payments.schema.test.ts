import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { paymentsRouter } from "../src/modules/payments/payments.routes";
import {
  createQuoteSchema,
  executePaymentSchema,
  isValidStellarAddress,
  quoteSchema,
  stellarAddressSchema,
  stellarAssetCodeSchema,
} from "../src/modules/payments/payments.schema";

describe("stellarAssetCodeSchema", () => {
  it("accepts valid 1-12 alphanumeric codes", () => {
    expect(stellarAssetCodeSchema.safeParse("USDC").success).toBe(true);
  });

  it("accepts single character code", () => {
    expect(stellarAssetCodeSchema.safeParse("A").success).toBe(true);
  });

  it("accepts 12-character code (max length)", () => {
    expect(stellarAssetCodeSchema.safeParse("ABCDEFGHIJKL").success).toBe(true);
  });

  it("accepts mixed case alphanumeric", () => {
    expect(stellarAssetCodeSchema.safeParse("AbCd1234").success).toBe(true);
  });

  it("accepts XLM (native asset special case)", () => {
    expect(stellarAssetCodeSchema.safeParse("XLM").success).toBe(true);
  });

  it("rejects empty string", () => {
    const result = stellarAssetCodeSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 12 characters", () => {
    const result = stellarAssetCodeSchema.safeParse("ABCDEFGHIJKLM");
    expect(result.success).toBe(false);
  });

  it("rejects spaces in asset code", () => {
    const result = stellarAssetCodeSchema.safeParse("US DC");
    expect(result.success).toBe(false);
  });

  it("rejects hyphens in asset code", () => {
    const result = stellarAssetCodeSchema.safeParse("USD-CDC");
    expect(result.success).toBe(false);
  });

  it("rejects unicode/emoji in asset code", () => {
    const result = stellarAssetCodeSchema.safeParse("USD\u{1F600}");
    expect(result.success).toBe(false);
  });

  it("rejects special characters", () => {
    const result = stellarAssetCodeSchema.safeParse("US$DC");
    expect(result.success).toBe(false);
  });

  it("rejects underscores", () => {
    const result = stellarAssetCodeSchema.safeParse("US_DC");
    expect(result.success).toBe(false);
  });
});

describe("stellarAddressSchema and isValidStellarAddress", () => {
  const validAddress =
    "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";

  it("accepts a valid 56-character Stellar public key", () => {
    expect(stellarAddressSchema.safeParse(validAddress).success).toBe(true);
    expect(isValidStellarAddress(validAddress)).toBe(true);
  });

  it("rejects address with invalid length", () => {
    const shortAddress = "GAJ5AO4AC3FPUCOR7VNSCH4";
    expect(stellarAddressSchema.safeParse(shortAddress).success).toBe(false);
    expect(isValidStellarAddress(shortAddress)).toBe(false);
  });

  it("rejects address with wrong prefix", () => {
    const invalidPrefix =
      "AAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";
    expect(stellarAddressSchema.safeParse(invalidPrefix).success).toBe(false);
    expect(isValidStellarAddress(invalidPrefix)).toBe(false);
  });

  it("rejects address with invalid checksum", () => {
    const invalidChecksum =
      "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHB";
    expect(stellarAddressSchema.safeParse(invalidChecksum).success).toBe(false);
    expect(isValidStellarAddress(invalidChecksum)).toBe(false);
  });
});

describe("quoteSchema", () => {
  it("accepts a valid quote request with XLM", () => {
    const result = quoteSchema.safeParse({
      assetCode: "XLM",
      amount: "100.50",
      destination: "GABC123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid quote request with USDC", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USDC",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(true);
  });

  it("rejects quote with invalid asset code containing space", () => {
    const result = quoteSchema.safeParse({
      assetCode: "US DC",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with missing amount", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USDC",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with missing destination", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USDC",
      amount: "50",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with empty asset code", () => {
    const result = quoteSchema.safeParse({
      assetCode: "",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });

  it("rejects quote with emoji in asset code", () => {
    const result = quoteSchema.safeParse({
      assetCode: "USD\u{1F600}",
      amount: "50",
      destination: "GXYZ789",
    });
    expect(result.success).toBe(false);
  });
});

describe("createQuoteSchema", () => {
  const validAddress =
    "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";

  it("accepts valid quote creation request with asset codes", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmount: "100.50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceAmount).toBe("100.50");
    }
  });

  it("accepts valid quote creation request with Stellar account address as asset", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: validAddress,
      sourceAmount: "50.00",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes leading zeros in sourceAmount", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmount: "007.00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceAmount).toBe("7.00");
    }
  });

  it("rejects malformed sourceAsset", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "US DC",
      destinationAsset: "USDC",
      sourceAmount: "100",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed destinationAsset", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: "USD-CDC",
      sourceAmount: "100",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative sourceAmount", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmount: "-10.00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero sourceAmount", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmount: "0.00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric sourceAmount", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmount: "not-a-number",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty sourceAmount", () => {
    const result = createQuoteSchema.safeParse({
      sourceAsset: "XLM",
      destinationAsset: "USDC",
      sourceAmount: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(
      createQuoteSchema.safeParse({
        destinationAsset: "USDC",
        sourceAmount: "100",
      }).success,
    ).toBe(false);

    expect(
      createQuoteSchema.safeParse({
        sourceAsset: "XLM",
        sourceAmount: "100",
      }).success,
    ).toBe(false);

    expect(
      createQuoteSchema.safeParse({
        sourceAsset: "XLM",
        destinationAsset: "USDC",
      }).success,
    ).toBe(false);
  });
});

describe("executePaymentSchema", () => {
  it("accepts valid execute payment request", () => {
    const result = executePaymentSchema.safeParse({
      quoteId: "quote_1700000000_abc123",
      confirmed: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts execute payment request with confirmed false", () => {
    const result = executePaymentSchema.safeParse({
      quoteId: "quote_1700000000_abc123",
      confirmed: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing confirmed flag", () => {
    const result = executePaymentSchema.safeParse({
      quoteId: "quote_1700000000_abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean confirmed flag", () => {
    const result = executePaymentSchema.safeParse({
      quoteId: "quote_1700000000_abc123",
      confirmed: "true",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-string quoteId", () => {
    const result = executePaymentSchema.safeParse({
      quoteId: 123456,
      confirmed: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty quoteId", () => {
    const result = executePaymentSchema.safeParse({
      quoteId: "",
      confirmed: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing quoteId", () => {
    const result = executePaymentSchema.safeParse({
      confirmed: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("HTTP payments route validation via validateBody", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/payments", paymentsRouter);
  app.use(
    (
      err: Error & {
        statusCode?: number;
        code?: string;
        details?: unknown;
      },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      void _next;
      res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || "VALIDATION_ERROR",
        message: err.message,
        details: err.details,
      });
    },
  );

  describe("POST /api/v1/payments", () => {
    it("returns 400 with VALIDATION_ERROR envelope for malformed Stellar asset code", async () => {
      const response = await request(app).post("/api/v1/payments").send({
        sourceAsset: "US DC",
        destinationAsset: "USDC",
        sourceAmount: "100.00",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details.fieldErrors.sourceAsset).toBeDefined();
    });

    it("returns 400 with VALIDATION_ERROR envelope for negative sourceAmount", async () => {
      const response = await request(app).post("/api/v1/payments").send({
        sourceAsset: "XLM",
        destinationAsset: "USDC",
        sourceAmount: "-50.00",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details.fieldErrors.sourceAmount).toBeDefined();
    });

    it("returns 400 with VALIDATION_ERROR envelope for non-numeric sourceAmount", async () => {
      const response = await request(app).post("/api/v1/payments").send({
        sourceAsset: "XLM",
        destinationAsset: "USDC",
        sourceAmount: "abc",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details.fieldErrors.sourceAmount).toBeDefined();
    });

    it("creates a quote and returns 201 for valid input", async () => {
      const response = await request(app).post("/api/v1/payments").send({
        sourceAsset: "XLM",
        destinationAsset: "USDC",
        sourceAmount: "007.00",
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.quote.sourceAmount).toBe("7.00");
    });
  });

  describe("POST /api/v1/payments/execute", () => {
    it("returns 400 when confirmed flag is missing", async () => {
      const response = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: "quote_12345_test",
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details.fieldErrors.confirmed).toBeDefined();
    });

    it("returns 400 when quoteId is not a string", async () => {
      const response = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId: 12345,
          confirmed: true,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details.fieldErrors.quoteId).toBeDefined();
    });

    it("returns 200 for valid execute payment payload", async () => {
      // First create quote so paymentsService has it
      const quoteRes = await request(app).post("/api/v1/payments").send({
        sourceAsset: "XLM",
        destinationAsset: "USDC",
        sourceAmount: "10.00",
      });
      const quoteId = quoteRes.body.data.quote.id;

      const response = await request(app)
        .post("/api/v1/payments/execute")
        .send({
          quoteId,
          confirmed: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment.status).toBe("settled");
    });
  });
});
