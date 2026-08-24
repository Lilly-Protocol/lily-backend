import type {
  CreatePaymentQuoteInput,
  CreatePaymentQuoteResponse,
  MoneyAmount,
  PaymentQuote,
} from "./payments.types";

const STELLAR_DECIMAL_PLACES = 7;
const QUOTE_TTL_SECONDS = 60;

// Stellar charges network fees in XLM regardless of the asset being sent.
const stubNetworkFee: MoneyAmount = {
  assetCode: "XLM",
  amount: "0.0000100",
};

const toStellarPrecision = (value: string): string => {
  const [whole, fraction = ""] = value.split(".");
  return `${whole}.${fraction.padEnd(STELLAR_DECIMAL_PLACES, "0")}`;
};

export const paymentsService = {
  createQuote(input: CreatePaymentQuoteInput): CreatePaymentQuoteResponse {
    const quote: PaymentQuote = {
      amount: {
        ...input.amount,
        amount: toStellarPrecision(input.amount.amount),
      },
      estimatedFee: stubNetworkFee,
      expiresAt: new Date(Date.now() + QUOTE_TTL_SECONDS * 1000).toISOString(),
    };

    return { quote };
  },
};
