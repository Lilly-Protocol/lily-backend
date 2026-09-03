import { describe, expect, it } from "vitest";

import { applyStubFee, paymentsService } from "../src/modules/payments/payments.service";

describe("applyStubFee", () => {
  it.each([
    ["100", "1"],
    ["0.01", "0.0001"],
    ["1.00", "0.01"],
    ["0", "0"],
    ["0.0000000", "0"],
    ["0.0000001", "0.000000001"],
    ["1.2345678", "0.012345678"],
    [
      "12345678901234567890123456789012345678901234567890",
      "123456789012345678901234567890123456789012345678.9",
    ],
  ])("calculates a one-percent fee for %s", (amount, expectedFee) => {
    expect(applyStubFee(amount)).toBe(expectedFee);
  });
});

describe("quote math", () => {
  it("uses the same one-percent fee policy as applyStubFee", () => {
    const { quote } = paymentsService.createQuote({
      sourceAsset: "USDC",
      destinationAsset: "XLM",
      sourceAmount: "100",
    });

    expect(quote.fee).toBe(applyStubFee("100"));
    expect(quote.fee).toBe("1");
    expect(quote.destinationAmount).toBe("100.02");
  });

  it("keeps large high-precision quote math exact", () => {
    const sourceAmount = "12345678901234567890.1234567";
    const { quote } = paymentsService.createQuote({
      sourceAsset: "USDC",
      destinationAsset: "XLM",
      sourceAmount,
    });

    expect(quote.fee).toBe("123456789012345678.901234567");
    expect(quote.destinationAmount).toBe("12348148037014814803.70148139134");
    expect(quote.fee).not.toMatch(/e[+-]?\d+/i);
    expect(quote.destinationAmount).not.toMatch(/e[+-]?\d+/i);
  });
});
