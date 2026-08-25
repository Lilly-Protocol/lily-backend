import type { QuoteRequest, QuoteResponse } from "./payments.types";

const generateQuoteId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `quote_${timestamp}_${random}`;
};

export const paymentsService = {
  createQuote(input: QuoteRequest): QuoteResponse {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min expiry

    const estimatedFee = "0.00001";

    return {
      quoteId: generateQuoteId(),
      fromWalletId: input.fromWalletId,
      toAddress: input.toAddress,
      amount: input.amount,
      assetCode: input.assetCode,
      estimatedFee,
      estimatedTotal: input.amount,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
  },
};
