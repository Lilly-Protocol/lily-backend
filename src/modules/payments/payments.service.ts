import type {
  CreatePaymentQuoteInput,
  PaymentQuote,
} from "./payments.types";

export const paymentsService = {
  createQuote(input: CreatePaymentQuoteInput): PaymentQuote {
    return {
      amount: {
        amount: input.amount,
        assetCode: input.assetCode.toUpperCase(),
      },
      estimatedFee: {
        amount: "0",
        assetCode: input.assetCode.toUpperCase(),
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  },
};