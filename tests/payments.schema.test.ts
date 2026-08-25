import { describe, expect, it } from "vitest";

import { quoteSchema } from "../src/modules/payments/payments.schema";

const validQuote = {
  fromWalletId: "wallet_abc123",
  toAddress: "G".repeat(56),
  amount: "10.5",
  assetCode: "USDC",
};

describe("quoteSchema format boundaries", () => {
  // These cases document the current length-only validation. Stellar-format
  // validation should be introduced separately as an intentional API change.
  it.each(["US DC", "US$DC"])(
    "currently accepts assetCode containing spaces or symbols: %s",
    (assetCode) => {
      expect(quoteSchema.safeParse({ ...validQuote, assetCode }).success).toBe(
        true,
      );
    },
  );

  it("rejects an assetCode longer than 12 characters", () => {
    const result = quoteSchema.safeParse({
      ...validQuote,
      assetCode: "A".repeat(13),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.assetCode).toBeDefined();
    }
  });

  it.each([
    ["short", "SHORT", true],
    ["64 characters", "G".repeat(64), true],
    ["over 64 characters", "G".repeat(65), false],
  ])(
    "handles a %s toAddress according to its length bound",
    (_, toAddress, success) => {
      expect(quoteSchema.safeParse({ ...validQuote, toAddress }).success).toBe(
        success,
      );
    },
  );
});
