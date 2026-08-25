import { describe, it, expect } from "vitest";
import { stellarAssetCodeSchema, quoteSchema } from "../src/modules/payments/payments.schema";

describe("stellarAssetCodeSchema", () => {
  // Valid asset codes
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

  // Invalid asset codes
  it("rejects code with space (e.g., 'US DC')", () => {
    const result = stellarAssetCodeSchema.safeParse("US DC");
    expect(result.success).toBe(false);
  });

  it("rejects code with hyphen", () => {
    const result = stellarAssetCodeSchema.safeParse("USD-C");
    expect(result.success).toBe(false);
  });

  it("rejects code with emoji (e.g., 'USD-😀')", () => {
    const result = stellarAssetCodeSchema.safeParse("USD-😀");
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = stellarAssetCodeSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 12 characters", () => {
    const result = stellarAssetCodeSchema.safeParse("ABCDEFGHIJKLM"); // 13 chars
    expect(result.success).toBe(false);
  });

  it("rejects code with special characters", () => {
    expect(stellarAssetCodeSchema.safeParse("USD!").success).toBe(false);
    expect(stellarAssetCodeSchema.safeParse("USD$").success).toBe(false);
    expect(stellarAssetCodeSchema.safeParse("US_D").success).toBe(false);
    expect(stellarAssetCodeSchema.safeParse("US.D").success).toBe(false);
  });

  it("rejects code with newline", () => {
    const result = stellarAssetCodeSchema.safeParse("USD\n");
    expect(result.success).toBe(false);
  });

  it("rejects non-string types", () => {
    expect(stellarAssetCodeSchema.safeParse(123).success).toBe(false);
    expect(stellarAssetCodeSchema.safeParse(null).success).toBe(false);
    expect(stellarAssetCodeSchema.safeParse(undefined).success).toBe(false);
    expect(stellarAssetCodeSchema.safeParse({}).success).toBe(false);
  });
});

describe("quoteSchema", () => {
  const validQuote = {
    assetCode: "USDC",
    amount: "100.50",
    destination: "GABC123...",
  };

  it("accepts a valid quote request", () => {
    const result = quoteSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
  });

  it("rejects quote with invalid assetCode (space)", () => {
    const result = quoteSchema.safeParse({ ...validQuote, assetCode: "US DC" });
    expect(result.success).toBe(false);
  });

  it("rejects quote with invalid assetCode (emoji)", () => {
    const result = quoteSchema.safeParse({ ...validQuote, assetCode: "USD-😀" });
    expect(result.success).toBe(false);
  });

  it("rejects quote with missing assetCode", () => {
    const { assetCode, ...rest } = validQuote;
    const result = quoteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects quote with empty amount", () => {
    const result = quoteSchema.safeParse({ ...validQuote, amount: "" });
    expect(result.success).toBe(false);
  });

  it("rejects quote with missing destination", () => {
    const { destination, ...rest } = validQuote;
    const result = quoteSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
