import { describe, expect, it } from "vitest";
import { paymentsService } from "../src/modules/payments/payments.service";

describe("Quote and Payment ID Generation (Issue #290)", () => {
  it("generates collision-resistant quote ids with quote_ prefix and UUID format", () => {
    paymentsService.reset();
    const count = 100;
    const ids = new Set<string>();

    for (let i = 0; i < count; i++) {
      const { quote } = paymentsService.createQuote({
        sourceAsset: "USDC",
        destinationAsset: "XLM",
        sourceAmount: "100.00",
      });
      expect(quote.id).toMatch(/^quote_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      ids.add(quote.id);
    }

    expect(ids.size).toBe(count);
  });

  it("generates collision-resistant payment ids with pay_ prefix and UUID format", () => {
    paymentsService.reset();

    const count = 50;
    const ids = new Set<string>();

    for (let i = 0; i < count; i++) {
      // Re-create active quote for each execution
      const q = paymentsService.createQuote({
        sourceAsset: "USDC",
        destinationAsset: "XLM",
        sourceAmount: "10.00",
      }).quote;

      const { payment } = paymentsService.executePayment({
        quoteId: q.id,
        confirmed: true,
      });

      expect(payment.id).toMatch(/^pay_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      ids.add(payment.id);
    }

    expect(ids.size).toBe(count);
  });
});
