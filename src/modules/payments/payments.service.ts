import { randomUUID } from "crypto";

import type {
  CreatePaymentQuoteResponse,
  PaymentQuoteInput,
} from "./payments.types";

const QUOTE_TTL_MS = 5 * 60 * 1000;

export const paymentsService = {
  createQuote(input: PaymentQuoteInput): CreatePaymentQuoteResponse {
    const amount = Number(input.amount);
    const feeAmount = 0;
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MS).toISOString();

    return {
      quote: {
        quoteId: `quote_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        fromWalletId: input.fromWalletId,
        toAddress: input.toAddress,
        amount: input.amount,
        assetCode: input.assetCode.toUpperCase(),
        feeAmount: feeAmount.toFixed(7),
        totalAmount: amount.toFixed(7),
        expiresAt,
        status: "quoted",
      },
    };
  },

  getQuote(input: PaymentQuoteInput): CreatePaymentQuoteResponse {
    return this.createQuote(input);
  },
};
