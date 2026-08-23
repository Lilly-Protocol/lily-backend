import type {
  CreatePaymentQuoteInput,
  CreatePaymentQuoteResponse,
} from "./payments.types";

export const paymentsService = {
  createQuote(input: CreatePaymentQuoteInput): CreatePaymentQuoteResponse {
    return {
      quote: {
        quoteId: `quote_${Date.now()}`,
        fromWalletId: input.fromWalletId,
        toAddress: input.toAddress,
        amount: input.amount,
        assetCode: input.assetCode,
        fee: "0",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    };
  },
};
