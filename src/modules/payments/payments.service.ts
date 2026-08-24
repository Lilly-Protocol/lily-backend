import type {
  CreatePaymentQuoteResponse,
  MoneyAmount,
  PaymentQuote,
  PaymentQuoteRequest,
} from "./payments.types";

const QUOTE_TTL_MS = 5 * 60 * 1000;
const STUBBED_FLAT_FEE = "0.01";

const copyMoneyAmount = (amount: MoneyAmount): MoneyAmount => ({
  assetCode: amount.assetCode,
  ...(amount.assetIssuer === undefined
    ? {}
    : { assetIssuer: amount.assetIssuer }),
  amount: amount.amount,
});

export const paymentsService = {
  createQuote(input: PaymentQuoteRequest): CreatePaymentQuoteResponse {
    const quote: PaymentQuote = {
      amount: copyMoneyAmount(input.amount),
      estimatedFee: {
        assetCode: input.amount.assetCode,
        amount: STUBBED_FLAT_FEE,
      },
      expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
    };

    return { quote };
  },
};
