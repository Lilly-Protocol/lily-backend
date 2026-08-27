import { describe, it, expect } from "vitest";
import { quoteSchema, stellarAddressSchema } from "../src/modules/payments/payments.schema";

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
    // Change the last character to invalidate the CRC
    const invalidChecksum = "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHB";
    expect(stellarAddressSchema.safeParse(invalidChecksum).success).toBe(false);
  });

  it("rejects addresses with wrong prefix", () => {
    // A starts with A instead of G or M (not a public key)
    const invalidPrefix = "AAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA";
    expect(stellarAddressSchema.safeParse(invalidPrefix).success).toBe(false);
  });
});

describe("quoteSchema", () => {
  it("validates toAddress properly", () => {
    const result = quoteSchema.safeParse({
      toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA"
    });
    expect(result.success).toBe(true);
  });
});
