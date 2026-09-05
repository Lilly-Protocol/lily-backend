import { describe, it, expect, vi } from "vitest";
import { apiKeyAuth } from "../src/common/http/api-key-auth.middleware";
import { createQuote } from "../src/modules/payments/payments.service";

describe("Security & ID Generation Enhancements", () => {
  it("should generate UUID-based quote IDs", () => {
    const quote = createQuote({
      sourceAsset: "XLM",
      sourceAmount: "100",
      destinationAsset: "USDC"
    });
    expect(quote.quoteId).toMatch(/^quote_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
