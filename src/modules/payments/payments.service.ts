import { randomUUID } from "node:crypto";

import type {
  CreateQuoteInput,
  CreateQuoteResponse,
  PaymentQuote,
} from "./payments.types";

const QUOTE_TTL_MS = 5 * 60 * 1000;

export const paymentsService = {
  createQuote(input: CreateQuoteInput): CreateQuoteResponse {
    const quote: PaymentQuote = {
      id: `quote_${randomUUID()}`,
      fromWalletId: input.fromWalletId,
      toAddress: input.toAddress,
      amount: input.amount,
      assetCode: input.assetCode,
      feeAmount: "0",
      totalAmount: input.amount,
      status: "pending",
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    };

    return { quote };
  },
};
