import type {
  CreatePaymentQuoteResponse,
  PaymentQuoteInput,
} from "./payments.types";

const QUOTE_TTL_MS = 5 * 60 * 1000;

const toFixedAssetAmount = (value: number): string => value.toFixed(7);

export const paymentsService = {
  createQuote(input: PaymentQuoteInput): CreatePaymentQuoteResponse {
    const amount = Number(input.amount);
    const feeAmount = 0;
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MS).toISOString();

    return {
      quote: {
        quoteId: "quote_stub_001",
        fromWalletId: input.fromWalletId,
        toAddress: input.toAddress,
        amount: input.amount,
        assetCode: input.assetCode,
        feeAmount: toFixedAssetAmount(feeAmount),
        totalAmount: toFixedAssetAmount(amount + feeAmount),
        expiresAt,
        status: "quoted",
      },
    };
  },
};
