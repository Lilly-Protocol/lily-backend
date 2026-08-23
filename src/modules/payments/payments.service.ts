import type { CreateQuoteSchema } from "./payments.schema";
import type { CreateQuoteResponse, PaymentQuote } from "./payments.types";

// Placeholder fee/expiry logic until real quote routing is wired up.
const STUB_FEE_RATE = 0.001;
const QUOTE_TTL_MS = 5 * 60 * 1000;

let quoteSequence = 0;

const createQuoteId = (): string => {
  quoteSequence += 1;
  return `quote_${Date.now()}_${quoteSequence}`;
};

const roundAmount = (value: number): number => Number(value.toFixed(7));

export const paymentsService = {
  createQuote(input: CreateQuoteSchema): CreateQuoteResponse {
    const now = new Date();
    const feeAmount = roundAmount(input.amount * STUB_FEE_RATE);
    const totalAmount = roundAmount(input.amount + feeAmount);

    const quote: PaymentQuote = {
      quoteId: createQuoteId(),
      fromWalletId: input.fromWalletId,
      toAddress: input.toAddress,
      assetCode: input.assetCode,
      amount: input.amount,
      feeAmount,
      totalAmount,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
    };

    return { quote };
  },

  reset(): void {
    quoteSequence = 0;
  },
};
