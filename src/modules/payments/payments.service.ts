import { randomUUID } from "crypto";
import type { QuoteRequest, QuoteResponse } from "./payments.types";

export const paymentsService = {
  getQuote(input: QuoteRequest): QuoteResponse {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    return {
      quote: {
        quoteId: randomUUID(),
        fee: "0",
        amountOut: input.amount,
        expiresAt: expiresAt.toISOString(),
      },
    };
  },
};
