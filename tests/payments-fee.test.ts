import { describe, expect, it } from "vitest";

import { applyStubFee } from "../src/modules/payments/payments.service";

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
