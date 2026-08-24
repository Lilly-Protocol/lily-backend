import type {
  PaymentQuoteRequest,
  PaymentQuoteResponse,
} from "./payments.types";

const createQuoteId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `quote_${timestamp}_${random}`;
};

export const paymentsService = {
  createQuote(input: PaymentQuoteRequest): PaymentQuoteResponse {
    const estimatedFee = "0.0000100";
    const amountNum = parseFloat(input.amount);
    const feeNum = parseFloat(estimatedFee);
    const totalCost = (amountNum + feeNum).toFixed(7);

    return {
      quoteId: createQuoteId(),
      fromWalletId: input.fromWalletId,
      toAddress: input.toAddress,
      amount: input.amount,
      assetCode: input.assetCode,
      estimatedFee,
      totalCost,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  },
};
