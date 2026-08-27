import { describe, it, expect } from "vitest";
import { createPaymentQuoteSchema, stellarAddressSchema } from "../src/modules/payments/payments.schema";

describe("stellarAddressSchema", () => {
  it("accepts valid Stellar addresses", () => {
    const validAddress = "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";
    expect(stellarAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("rejects addresses with invalid length", () => {
    const shortAddress = "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIH";
    const longAddress = "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHAAA";
    
    expect(stellarAddressSchema.safeParse(shortAddress).success).toBe(false);
    expect(stellarAddressSchema.safeParse(longAddress).success).toBe(false);
  });

  it("rejects addresses with invalid checksum", () => {
    const invalidChecksum = "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHB";
    expect(stellarAddressSchema.safeParse(invalidChecksum).success).toBe(false);
  });

  it("rejects addresses with wrong prefix", () => {
    const invalidPrefix = "AAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";
    expect(stellarAddressSchema.safeParse(invalidPrefix).success).toBe(false);
  });
});

describe("createPaymentQuoteSchema", () => {
  it("validates toAddress properly", () => {
    const result = createPaymentQuoteSchema.safeParse({
      fromWalletId: "wallet_123",
      amount: "25.5",
      assetCode: "USDC",
      toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA"
    });
    expect(result.success).toBe(true);
  });
});
