import { describe, expect, it } from "vitest";

import {
  quoteSchema,
  stellarAddressSchema,
} from "../src/modules/payments/payments.schema";

const validPayload = {
  fromWalletId: "wallet_user_001",
  toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
  amount: "100.50",
  assetCode: "USDC",
};

describe("payments quote schema", () => {
  it("validates stellarAddressSchema directly", () => {
    expect(stellarAddressSchema.safeParse(validPayload.toAddress).success).toBe(
      true,
    );
    expect(stellarAddressSchema.safeParse("foo").success).toBe(false);
  });

  it("validates a well-formed payment quote payload", () => {
    const result = quoteSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects non-56-character toAddress", () => {
    const shortAddressResult = quoteSchema.safeParse({
      ...validPayload,
      toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIH", // 55 chars
    });
    expect(shortAddressResult.success).toBe(false);
    if (!shortAddressResult.success) {
      expect(
        shortAddressResult.error.flatten().fieldErrors.toAddress,
      ).toBeDefined();
    }

    const arbitraryStringResult = quoteSchema.safeParse({
      ...validPayload,
      toAddress: "foo",
    });
    expect(arbitraryStringResult.success).toBe(false);

    const length64Result = quoteSchema.safeParse({
      ...validPayload,
      toAddress: "G".repeat(64),
    });
    expect(length64Result.success).toBe(false);
  });

  it("rejects wrong-prefix toAddress", () => {
    const wrongPrefixResult = quoteSchema.safeParse({
      ...validPayload,
      toAddress: "AAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHA",
    });
    expect(wrongPrefixResult.success).toBe(false);
    if (!wrongPrefixResult.success) {
      expect(
        wrongPrefixResult.error.flatten().fieldErrors.toAddress,
      ).toBeDefined();
    }
  });

  it("rejects invalid checksum toAddress", () => {
    const invalidChecksumResult = quoteSchema.safeParse({
      ...validPayload,
      toAddress: "GAJ5AO4AC3FPUCOR7VNSCH4AFW3VUDDAELHBBVY3TQ7GI3GZS2S3WIHB",
    });
    expect(invalidChecksumResult.success).toBe(false);
    if (!invalidChecksumResult.success) {
      expect(
        invalidChecksumResult.error.flatten().fieldErrors.toAddress,
      ).toBeDefined();
    }
  });
});
