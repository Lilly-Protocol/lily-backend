import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  applyStubFee,
  paymentsService,
} from "../src/modules/payments/payments.service";

const LARGE_SOURCE =
  "12345678901234567890123456789012345678901234567890";
const LARGE_DESTINATION =
  "12348148037014814803701481480370148148037014814803.578";

const quoteFor = (sourceAmount: string) =>
  paymentsService.createQuote({
    sourceAsset: "USDC",
    destinationAsset: "XLM",
    sourceAmount,
  }).quote;

describe("applyStubFee", () => {
  it.each([
    ["100", "1"],
    ["0.01", "0.0001"],
    ["1.00", "0.01"],
    ["0", "0"],
    ["0.0000000", "0"],
    ["0.0000001", "0.000000001"],
    ["1.2345678", "0.012345678"],
    [LARGE_SOURCE, "123456789012345678901234567890123456789012345678.9"],
  ])("calculates a one-percent fee for %s", (amount, expectedFee) => {
    expect(applyStubFee(amount)).toBe(expectedFee);
  });
});

describe("createQuote fee and destination math", () => {
  it("returns the same fee as applyStubFee for sourceAmount 100", () => {
    const quote = quoteFor("100");
    expect(quote.fee).toBe(applyStubFee("100"));
    expect(quote.fee).toBe("1");
    expect(quote.destinationAmount).toBe("100.02");
    expect(quote.rate).toBe("1.0002");
  });

  it.each([
    ["100", "100.02"],
    ["1", "1.0002"],
    ["0", "0"],
    ["0.01", "0.010002"],
    ["1.2345678", "1.23481471356"],
    [LARGE_SOURCE, LARGE_DESTINATION],
  ])(
    "computes exact source * 1.0002 destinationAmount for %s",
    (sourceAmount, expectedDestination) => {
      const quote = quoteFor(sourceAmount);
      expect(quote.fee).toBe(applyStubFee(sourceAmount));
      expect(quote.destinationAmount).toBe(expectedDestination);
      expect(quote.fee).not.toMatch(/e/i);
      expect(quote.destinationAmount).not.toMatch(/e/i);
    },
  );

  it("does not use parseFloat for money arithmetic in quote helpers", () => {
    const sourcePath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../src/modules/payments/payments.service.ts",
    );
    const source = readFileSync(sourcePath, "utf8");
    const helpers = source.slice(
      source.indexOf("const computeDestinationAmount"),
      source.indexOf("const refreshExpiry"),
    );

    expect(helpers).toContain("applyStubFee");
    expect(helpers).not.toContain("parseFloat");
    expect(helpers).not.toContain("toFixed");
  });
});
