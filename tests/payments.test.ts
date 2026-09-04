import { describe, expect, it } from "vitest";

import {
  createQuoteSchema,
  normalizeAmount,
  quoteSchema,
} from "../src/modules/payments/payments.schema";

describe("normalizeAmount", () => {
  it("strips leading zeros from integer part", () => {
    expect(normalizeAmount("007.00")).toBe("7.00");
  });

  it("preserves valid amounts without leading zeros", () => {
    expect(normalizeAmount("100.00")).toBe("100.00");
  });

  it("keeps single zero before decimal for sub-unit amounts", () => {
    expect(normalizeAmount("0.50")).toBe("0.50");
  });

  it("normalizes multiple leading zeros", () => {
    expect(normalizeAmount("0000123.45")).toBe("123.45");
  });

  it("handles integer-only amounts", () => {
    expect(normalizeAmount("007")).toBe("7");
  });

  it("trims whitespace", () => {
    expect(normalizeAmount("  007.00  ")).toBe("7.00");
  });
});

describe("quoteSchema", () => {
  it("normalizes amount on parse", () => {
    const result = quoteSchema.parse({
      assetCode: "USDC",
      amount: "007.00",
      destination: "GABC123",
    });
    expect(result.amount).toBe("7.00");
  });

  it("trims and validates destination", () => {
    const result = quoteSchema.parse({
      assetCode: "USDC",
      amount: "10.00",
      destination: "  GABC123  ",
    });
    expect(result.destination).toBe("GABC123");
  });

  it("rejects empty amount", () => {
    expect(() =>
      quoteSchema.parse({
        assetCode: "USDC",
        amount: "",
        destination: "GABC123",
      }),
    ).toThrow();
  });
});

describe("createQuoteSchema", () => {
  it("normalizes sourceAmount on parse", () => {
    const result = createQuoteSchema.parse({
      sourceAsset: "USDC",
      destinationAsset: "XLM",
      sourceAmount: "007.00",
    });
    expect(result.sourceAmount).toBe("7.00");
  });

  it("rejects missing assets", () => {
    expect(() =>
      createQuoteSchema.parse({
        sourceAsset: "USDC",
        sourceAmount: "10.00",
      }),
    ).toThrow();
  });
});
